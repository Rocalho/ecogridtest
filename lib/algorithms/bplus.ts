export interface BPlusTreeSerialized {
    order: number;
    root: BPlusNodeSerialized | null;
}

export interface BPlusNodeSerialized {
    isLeaf: boolean;
    keys: number[];
    values?: any[];
    children?: BPlusNodeSerialized[];
}


class BPlusNode {
    isLeaf: boolean;
    keys: number[];
    values: any[];
    children: BPlusNode[];
    next: BPlusNode | null;
    parent: BPlusNode | null;

    constructor(isLeaf: boolean) {
        this.isLeaf = isLeaf;
        this.keys = [];
        this.values = isLeaf ? [] : [];
        this.children = isLeaf ? [] : [];
        this.next = null;
        this.parent = null;
    }

    serialize(): BPlusNodeSerialized {
        const serialized: BPlusNodeSerialized = {
            isLeaf: this.isLeaf,
            keys: [...this.keys],
        };

        if (this.isLeaf) {
            serialized.values = [...this.values];
        } else {
            serialized.children = this.children.map(child => child.serialize());
        }

        return serialized;
    }

    static deserialize(data: BPlusNodeSerialized): BPlusNode {
        const node = new BPlusNode(data.isLeaf);
        node.keys = [...data.keys];

        if (data.isLeaf && data.values) {
            node.values = [...data.values];
        } else if (!data.isLeaf && data.children) {
            node.children = data.children.map(child => {
                const childNode = BPlusNode.deserialize(child);
                childNode.parent = node;
                return childNode;
            });
        }

        return node;
    }
}

export class BPlusTree {
    private root: BPlusNode | null;
    private order: number;
    private minKeys: number;

    constructor(order: number = 4) {
        if (order < 2) {
            throw new Error("A ordem da árvore deve ser pelo menos 2");
        }
        this.order = order;
        this.minKeys = Math.ceil(order / 2) - 1;
        this.root = new BPlusNode(true);
    }

    insert(key: number, value: any): void {
        if (this.root === null) {
            this.root = new BPlusNode(true);
        }

        if (this.root.keys.length >= this.order) {
            const newRoot = new BPlusNode(false);
            newRoot.children.push(this.root);
            this.root.parent = newRoot;
            this.splitChild(newRoot, 0);
            this.root = newRoot;
        }

        this.insertNonFull(this.root, key, value);
    }

    private insertNonFull(node: BPlusNode, key: number, value: any): void {
        if (node.isLeaf) {
            let i = node.keys.length - 1;
            while (i >= 0 && node.keys[i] > key) {
                i--;
            }
            node.keys.splice(i + 1, 0, key);
            node.values.splice(i + 1, 0, value);
        } else {
            let i = node.keys.length - 1;
            while (i >= 0 && node.keys[i] > key) {
                i--;
            }
            i++;

            if (node.children[i].keys.length >= this.order) {
                this.splitChild(node, i);
                if (node.keys[i] < key) {
                    i++;
                }
            }

            this.insertNonFull(node.children[i], key, value);
        }
    }

    private splitChild(parent: BPlusNode, index: number): void {
        const child = parent.children[index];
        const newChild = new BPlusNode(child.isLeaf);
        newChild.parent = parent;

        const mid = Math.floor(this.order / 2);
        let midKey: number;

        if (child.isLeaf) {

            midKey = child.keys[mid];
            newChild.keys = child.keys.splice(mid);
            newChild.values = child.values.splice(mid);

            newChild.next = child.next;
            child.next = newChild;
        } else {
            midKey = child.keys[mid];
            newChild.keys = child.keys.splice(mid + 1);
            child.keys.splice(mid, 1);

            newChild.children = child.children.splice(mid + 1);
            for (const grandchild of newChild.children) {
                grandchild.parent = newChild;
            }
        }

        parent.keys.splice(index, 0, midKey);
        parent.children.splice(index + 1, 0, newChild);
    }

    search(key: number): any | null {
        if (this.root === null) {
            return null;
        }

        const node = this.findLeaf(this.root, key);
        if (node === null) {
            return null;
        }

        const index = node.keys.indexOf(key);
        if (index === -1) {
            return null;
        }

        return node.values[index];
    }

    private findLeaf(node: BPlusNode, key: number): BPlusNode | null {
        if (node.isLeaf) {
            return node;
        }

        let i = 0;
        while (i < node.keys.length && node.keys[i] <= key) {
            i++;
        }

        if (i < node.children.length) {
            return this.findLeaf(node.children[i], key);
        }

        return null;
    }

    rangeQuery(min: number, max: number): Array<{ key: number; value: any }> {
        const results: Array<{ key: number; value: any }> = [];

        if (this.root === null) {
            return results;
        }

        const startNode = this.findLeaf(this.root, min);
        if (startNode === null) {
            return results;
        }

        let node: BPlusNode | null = startNode;
        while (node !== null) {
            for (let i = 0; i < node.keys.length; i++) {
                const key = node.keys[i];
                if (key > max) {
                    return results;
                }
                if (key >= min) {
                    results.push({
                        key,
                        value: node.values[i],
                    });
                }
            }
            node = node.next;
        }

        return results;
    }

    serialize(): BPlusTreeSerialized {
        return {
            order: this.order,
            root: this.root ? this.root.serialize() : null,
        };
    }

    static deserialize(data: BPlusTreeSerialized): BPlusTree {
        const tree = new BPlusTree(data.order);
        if (data.root) {
            tree.root = BPlusNode.deserialize(data.root);
            tree.rebuildLeafLinks(tree.root);
        } else {
            tree.root = null;
        }
        return tree;
    }

    private rebuildLeafLinks(node: BPlusNode): void {
        if (node.isLeaf) {
            return;
        }

        const leaves: BPlusNode[] = [];
        this.collectLeaves(node, leaves);

        for (let i = 0; i < leaves.length - 1; i++) {
            leaves[i].next = leaves[i + 1];
        }
        if (leaves.length > 0) {
            leaves[leaves.length - 1].next = null;
        }
    }

    private collectLeaves(node: BPlusNode, leaves: BPlusNode[]): void {
        if (node.isLeaf) {
            leaves.push(node);
        } else {
            for (const child of node.children) {
                this.collectLeaves(child, leaves);
            }
        }
    }

    getTreeStructure(): any {
        if (this.root === null) {
            return null;
        }

        return this.getNodeStructure(this.root);
    }

    private getNodeStructure(node: BPlusNode): any {
        const structure: any = {
            isLeaf: node.isLeaf,
            keys: [...node.keys],
            keyCount: node.keys.length,
        };

        if (node.isLeaf) {
            structure.values = node.values.map((v, i) => ({
                key: node.keys[i],
                value: v,
            }));
        } else {
            structure.children = node.children.map(child => this.getNodeStructure(child));
        }

        return structure;
    }

    getStats(): {
        order: number;
        totalKeys: number;
        height: number;
        leafCount: number;
    } {
        if (this.root === null) {
            return {
                order: this.order,
                totalKeys: 0,
                height: 0,
                leafCount: 0,
            };
        }

        let totalKeys = 0;
        let leafCount = 0;
        let height = 0;

        const countNodes = (node: BPlusNode, depth: number): void => {
            if (depth > height) {
                height = depth;
            }

            totalKeys += node.keys.length;

            if (node.isLeaf) {
                leafCount++;
            } else {
                for (const child of node.children) {
                    countNodes(child, depth + 1);
                }
            }
        };

        countNodes(this.root, 1);

        return {
            order: this.order,
            totalKeys,
            height,
            leafCount,
        };
    }
}

