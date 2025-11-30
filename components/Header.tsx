
export default function Header(
    { children }:
        { children: string }
) {
    return (
        <h1 className="text-2xl text-slate-800 font-semibold">{children}</h1>
    )
}