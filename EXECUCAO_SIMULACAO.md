# 🔄 O Que Acontece ao Clicar em "Executar Ciclo de Simulação"

Este documento explica detalhadamente todo o fluxo que ocorre quando você clica no botão **"Executar ciclo de simulação"** na página de Simulação.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Fluxo Completo Passo a Passo](#fluxo-completo-passo-a-passo)
3. [Detalhamento de Cada Etapa](#detalhamento-de-cada-etapa)
4. [Exemplo Prático](#exemplo-prático)
5. [Logs Esperados](#logs-esperados)

---

## 🎯 Visão Geral

Ao clicar em **"Executar ciclo de simulação"**, o sistema:

1. ✅ Processa o próximo evento da fila FIFO
2. ✅ Aplica o evento ao grafo da rede
3. ✅ Verifica condições críticas (sobrecarga, falhas)
4. ✅ **Executa balanceamento automático AVL** (se necessário)
5. ✅ Recalcula métricas (perdas, eficiência, consumo)
6. ✅ Atualiza a interface com novos dados
7. ✅ Atualiza as filas de eventos (FIFO e Heap)
8. ✅ Gera logs detalhados

---

## 🔄 Fluxo Completo Passo a Passo

### **1. Clique no Botão (Frontend)**

**Arquivo:** `app/(app)/simulation/page.tsx`

**O que acontece:**
```typescript
handleRunSimulation() {
  // 1.1. Define estado de loading
  setIsLoading(true);
  
  // 1.2. Adiciona log de início
  addLog("Iniciando ciclo de simulação...", "info", "simulation");
  
  // 1.3. Faz requisição POST para /api/simulation/run
  fetch("/api/simulation/run", { method: "POST" })
}
```

**Resultado na UI:**
- ✅ Botão muda para "Executando..." e fica desabilitado
- ✅ Log aparece: `[INFO] Iniciando ciclo de simulação...`

---

### **2. Requisição para API (Backend)**

**Arquivo:** `app/api/simulation/run/route.ts`

**O que acontece:**
```typescript
POST /api/simulation/run

// 2.1. Obtém instância do grafo da rede
const graph = await getNetworkInstance();

// 2.2. Obtém filas de eventos
const fifo = getFIFOQueue();  // Fila FIFO (ordem cronológica)
const heap = getMinHeap();    // Heap de prioridade (por severidade)

// 2.3. Executa ciclo de simulação
const result = runSimulationCycle(graph, fifo, heap);
```

**Resultado:**
- ✅ Sistema tem acesso ao grafo e às filas de eventos

---

### **3. Processamento do Ciclo (Coração da Simulação)**

**Arquivo:** `lib/simulation.ts` - Função `runSimulationCycle()`

#### **3.1. Processamento de Evento FIFO**

**O que acontece:**
```typescript
// Remove próximo evento da fila FIFO (primeiro a entrar, primeiro a sair)
const event = fifo.dequeue();

if (event) {
  // Aplica evento ao grafo
  applyEventToGraph(graph, event);
}
```

**Tipos de eventos suportados:**
- `demand_change` - Altera demanda de um nó
- `node_failure` - Marca nó como inativo
- `node_recovery` - Reativa um nó
- `overload` - Aumenta carga de um nó/aresta
- `capacity_change` - Altera capacidade

**Exemplo de evento:**
```json
{
  "type": "overload",
  "payload": {
    "nodeId": "node-1",
    "multiplier": 1.5
  },
  "severity": 1,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

**Ação aplicada:**
- ✅ Se `overload` → Aumenta demanda do nó: `demanda = demanda * 1.5`
- ✅ Log gerado: `"Nó node-1 sobrecarregado: demanda aumentada para 75.00"`

---

#### **3.2. Verificação de Condições Críticas**

**O que acontece:**
```typescript
checkCriticalConditions(graph, heap) {
  // Verifica todos os nós da rede
  for (const node of graph.getAllNodes()) {
    const utilization = node.demand / node.capacity;
    
    // Se utilização >= 90%
    if (utilization >= 0.9) {
      // Adiciona evento crítico ao heap (prioridade por severidade)
      heap.insert({
        type: "critical_overload",
        severity: utilization >= 0.95 ? 0 : 1,  // 0 = mais crítico
        ...
      });
      
      // Gera log de aviso/erro
      logs.push({
        level: utilization >= 0.95 ? "error" : "warning",
        message: `Condição crítica detectada: nó ${node.id} com ${utilization*100}% de utilização`
      });
    }
  }
  
  // Verifica arestas sobrecarregadas
  // Verifica nós inativos
}
```

**Resultado:**
- ✅ Eventos críticos são adicionados ao Heap (ordenados por severidade)
- ✅ Logs de aviso/erro são gerados

**Exemplo de log:**
```
[WARNING] Condição crítica detectada: nó node-1 com 95.0% de utilização
```

---

#### **3.3. Balanceamento Automático AVL** ⚡ **FUNCIONALIDADE PRINCIPAL**

**O que acontece:**
```typescript
// Verifica se há condições críticas
const shouldBalance = criticalLogs.some(log => 
  log.level === "error" || log.level === "warning"
);

if (shouldBalance) {
  // Cria balanceador usando AVL
  const balancer = new LoadBalancer(graph);
  
  // Executa balanceamento automático
  const balanceResult = balancer.balanceLoad();
  
  // balanceResult contém:
  // - success: true/false
  // - balancedNodes: [{nodeId, oldLoad, newLoad}, ...]
  // - efficiencyGain: número (ganho de eficiência)
  // - messages: ["Redistribuído 10A de node-1 para node-2 via 2 saltos", ...]
}
```

**Processo interno do balanceamento:**

1. **Reconstrói índice AVL** com utilização atual dos nós
2. **Encontra nós sobrecarregados** (utilização >= 90%) usando AVL O(log n)
3. **Encontra nós subutilizados** (utilização < 90%) usando AVL O(log n)
4. **Para cada nó sobrecarregado:**
   - Calcula excesso de carga: `excesso = carga - (capacidade * 0.9)`
   - Para cada nó subutilizado:
     - Usa A* para encontrar caminho ótimo entre os nós
     - Calcula quanto transferir (até 50% do espaço disponível)
     - Redistribui carga: `nó_origem.carga -= transfer`, `nó_destino.carga += transfer`
     - Atualiza grafo
5. **Calcula ganho de eficiência** após balanceamento

**Logs gerados:**
```typescript
logs.push({
  level: "success",
  message: `Balanceamento automático AVL: ${X} redistribuições realizadas`
});

// Logs detalhados de cada redistribuição
balanceResult.messages.forEach(msg => {
  logs.push({
    level: "info",
    message: `  → ${msg}`  // Ex: "Redistribuído 10.00A de node-1 para node-2 via 2 saltos"
  });
});

// Log de ganho de eficiência
logs.push({
  level: "success",
  message: `Ganho de eficiência: +${efficiencyGain * 100}%`
});
```

**Resultado:**
- ✅ Carga é redistribuída automaticamente
- ✅ Nós sobrecarregados ficam abaixo de 90%
- ✅ Eficiência global aumenta
- ✅ Logs detalhados são gerados

---

#### **3.4. Recalculation de Métricas**

**O que acontece:**
```typescript
// Calcula perdas totais (P = I² * R para cada aresta)
const losses = graph.computeLosses();

// Calcula eficiência global
const efficiency = graph.computeEfficiency();
// Fórmula: (energia_útil / energia_total) * 100

// Calcula consumo total (soma de demanda de consumidores)
const consumption = graph.computeConsumption();
```

**Métricas calculadas:**
- **Perdas:** Soma de perdas em todas as arestas
- **Eficiência:** (Produção - Perdas) / Produção * 100
- **Consumo:** Soma de demanda de todos os nós tipo CONSUMER

**Log gerado:**
```
[INFO] Métricas recalculadas: Perdas=15.30, Eficiência=92.45%, Consumo=180.50
```

---

#### **3.5. Preparação do Resultado**

**O que acontece:**
```typescript
return {
  graph: {
    nodes: [...],  // Estado atualizado de todos os nós
    edges: [...]   // Estado atualizado de todas as arestas
  },
  metrics: {
    losses: 15.30,
    efficiency: 92.45,
    consumption: 180.50
  },
  logs: [...],  // Todos os logs gerados durante o ciclo
  pendingEvents: {
    fifo: 2,   // Eventos restantes na fila FIFO
    heap: 1    // Eventos críticos restantes no heap
  }
};
```

---

### **4. Resposta para o Frontend**

**Arquivo:** `app/api/simulation/run/route.ts`

**O que acontece:**
```typescript
return NextResponse.json({
  success: true,
  data: {
    graph: result.graph,      // Nós e arestas atualizados
    metrics: result.metrics,   // Novas métricas
    logs: result.logs,        // Todos os logs
    pendingEvents: result.pendingEvents
  }
});
```

---

### **5. Atualização da Interface (Frontend)**

**Arquivo:** `app/(app)/simulation/page.tsx`

**O que acontece:**

#### **5.1. Atualização do Grafo**
```typescript
// Converte nós do backend para formato ReactFlow
const reactFlowNodes = graph.nodes.map(backendNode => 
  backendNodeToReactFlowNode(backendNode, position)
);

// Converte arestas do backend para formato ReactFlow
const reactFlowEdges = graph.edges.map(backendEdge => 
  backendEdgeToReactFlowEdge(backendEdge)
);

// Atualiza estado global da rede
setNetworkFromBackend(reactFlowNodes, reactFlowEdges);
```

**Resultado:**
- ✅ Visualização do grafo é atualizada
- ✅ Cores dos nós mudam conforme utilização
- ✅ Arestas são atualizadas

---

#### **5.2. Atualização de Métricas**
```typescript
setPreviousMetrics(metrics);  // Guarda métricas anteriores
setMetrics(newMetrics);       // Define novas métricas

// Calcula variações (delta)
const efficiencyVariance = calculateVariance(
  currentEfficiency, 
  previousMetrics.efficiency
);
```

**Resultado:**
- ✅ KPIs são atualizados na interface
- ✅ Variações são calculadas e exibidas

---

#### **5.3. Exibição de Logs**
```typescript
// Para cada log retornado
simulationLogs.forEach(log => {
  addLog(log.message, log.level, "simulation");
});
```

**Resultado:**
- ✅ Logs aparecem na seção "Logs da Simulação"
- ✅ Cores diferentes por nível (info=azul, warning=amarelo, error=vermelho, success=verde)

---

#### **5.4. Atualização das Filas de Eventos**
```typescript
await loadEvents();  // Recarrega eventos das filas FIFO e Heap
```

**Resultado:**
- ✅ Fila FIFO mostra eventos restantes
- ✅ Heap mostra eventos críticos ordenados por severidade

---

#### **5.5. Finalização**
```typescript
setIsLoading(false);  // Remove loading
addLog("Ciclo de simulação executado com sucesso", "success", "simulation");
```

**Resultado:**
- ✅ Botão volta ao normal
- ✅ Log de sucesso é adicionado

---

## 📊 Resumo Visual do Fluxo

```
┌─────────────────────────────────────────────────────────┐
│  1. Usuário clica em "Executar ciclo de simulação"     │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. Frontend envia POST /api/simulation/run            │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. Backend obtém grafo e filas (FIFO + Heap)          │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. Processa próximo evento da fila FIFO               │
│     → Aplica evento ao grafo                           │
│     → Gera logs                                        │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. Verifica condições críticas                        │
│     → Detecta nós/arestas sobrecarregados              │
│     → Adiciona eventos críticos ao Heap                │
│     → Gera logs de aviso/erro                          │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. ⚡ BALANCEAMENTO AUTOMÁTICO AVL                     │
│     → Reconstrói índice AVL                            │
│     → Encontra nós sobrecarregados (O(log n))          │
│     → Encontra nós subutilizados (O(log n))            │
│     → Usa A* para encontrar caminhos                   │
│     → Redistribui carga automaticamente                │
│     → Calcula ganho de eficiência                      │
│     → Gera logs detalhados                             │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  7. Recalcula métricas                                 │
│     → Perdas totais                                    │
│     → Eficiência global                                │
│     → Consumo total                                    │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  8. Retorna resultado para frontend                    │
│     → Grafo atualizado                                 │
│     → Métricas                                         │
│     → Logs                                             │
│     → Eventos pendentes                                │
└────────────────────┬────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────┐
│  9. Frontend atualiza interface                        │
│     → Atualiza visualização do grafo                   │
│     → Atualiza KPIs                                    │
│     → Exibe logs                                       │
│     → Atualiza filas de eventos                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Exemplo Prático Completo

### **Cenário:**
- Nó A: Capacidade 100A, Carga 95A (95% utilização)
- Nó B: Capacidade 100A, Carga 20A (20% utilização)
- Aresta A→B conectando os nós

### **Passo a Passo:**

#### **1. Estado Inicial**
```
FIFO: [evento: overload(node-A, multiplier=1.05)]
Heap: []
```

#### **2. Clique em "Executar Ciclo"**

#### **3. Processamento**
```
[INFO] Processando evento: overload
[WARNING] Nó node-A sobrecarregado: demanda aumentada para 99.75
```

#### **4. Verificação Crítica**
```
[ERROR] Condição crítica detectada: nó node-A com 99.8% de utilização
→ Evento crítico adicionado ao Heap (severity: 0)
```

#### **5. Balanceamento Automático**
```
[SUCCESS] Balanceamento automático AVL: 1 redistribuição realizada
  → Redistribuído 10.00A de node-A para node-B via 1 saltos
[SUCCESS] Ganho de eficiência: +3.25%
```

#### **6. Recalculation**
```
[INFO] Métricas recalculadas: Perdas=12.45, Eficiência=93.67%, Consumo=200.00
```

#### **7. Estado Final**
```
Nó A: Capacidade 100A, Carga 89.75A (89.75% utilização) ✅
Nó B: Capacidade 100A, Carga 30A (30% utilização) ✅

FIFO: [] (evento processado e removido)
Heap: [critical_overload(node-A)] (ainda presente até próximo ciclo)
```

---

## 📋 Logs Esperados

### **Logs Típicos de um Ciclo:**

```
[INFO] Iniciando ciclo de simulação...
[INFO] Processando evento: overload
[WARNING] Nó node-1 sobrecarregado: demanda aumentada para 95.00
[WARNING] Condição crítica detectada: nó node-1 com 95.0% de utilização
[SUCCESS] Balanceamento automático AVL: 1 redistribuição realizada
  → Redistribuído 5.00A de node-1 para node-2 via 1 saltos
[SUCCESS] Ganho de eficiência: +2.15%
[INFO] Métricas recalculadas: Perdas=10.50, Eficiência=94.20%, Consumo=150.00
[SUCCESS] Ciclo de simulação executado com sucesso
```

### **Níveis de Log:**
- 🔵 **INFO** - Informações gerais
- 🟡 **WARNING** - Avisos (sobrecarga detectada)
- 🔴 **ERROR** - Erros críticos (utilização >= 95%)
- 🟢 **SUCCESS** - Sucessos (balanceamento executado, ganho de eficiência)

---

## ✅ Checklist: O Que Deve Acontecer

Ao clicar em "Executar ciclo de simulação", verifique:

- [ ] Botão muda para "Executando..." e fica desabilitado
- [ ] Log aparece: "Iniciando ciclo de simulação..."
- [ ] Se há evento na FIFO:
  - [ ] Evento é processado
  - [ ] Log mostra tipo do evento processado
  - [ ] Ação é aplicada ao grafo
- [ ] Se há condições críticas:
  - [ ] Logs de aviso/erro aparecem
  - [ ] Eventos críticos são adicionados ao Heap
- [ ] Se há sobrecarga:
  - [ ] Log: "Balanceamento automático AVL: X redistribuições realizadas"
  - [ ] Logs detalhados de redistribuições aparecem
  - [ ] Log de ganho de eficiência aparece
- [ ] Métricas são recalculadas:
  - [ ] Log: "Métricas recalculadas: Perdas=X, Eficiência=Y%, Consumo=Z"
- [ ] Interface é atualizada:
  - [ ] Grafo visual é atualizado
  - [ ] KPIs são atualizados
  - [ ] Logs aparecem na seção de logs
  - [ ] Filas FIFO e Heap são atualizadas
- [ ] Log final: "Ciclo de simulação executado com sucesso"
- [ ] Botão volta ao normal

---

## 🎓 Conclusão

O ciclo de simulação é o **coração do sistema EcoGrid+**. Ele:

1. ✅ Processa eventos em ordem cronológica (FIFO)
2. ✅ Detecta condições críticas automaticamente
3. ✅ **Redistribui carga automaticamente usando AVL** quando necessário
4. ✅ Recalcula todas as métricas
5. ✅ Atualiza a interface em tempo real
6. ✅ Gera logs detalhados de todas as operações

Tudo isso acontece em **um único clique**! 🚀



