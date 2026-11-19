import { expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const root = path.resolve(__dirname, "../../src");
function files(directory: string): string[] { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(path.join(directory, item.name)) : /\.tsx?$/.test(item.name) && !/\.(test|spec)\.ts$/.test(item.name) ? [path.join(directory, item.name)] : []); }
function owner(file: string) { const parts = path.relative(root, file).split(path.sep); return parts[0] === "modules" ? parts.slice(0, parts[1] === "public-reporting" ? 2 : 3).join("/") : null; }
function resolve(file: string, source: string) { const base = path.resolve(path.dirname(file), source); return [base, base + ".ts", path.join(base, "index.ts")].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()); }
it("keeps controllers out of repositories and cross-module imports on public entrypoints", () => {
    const violations: string[] = [], graph = new Map<string, Set<string>>();
    for (const file of files(root)) {
        const ast = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true), from = owner(file);
        ts.forEachChild(ast, node => {
            if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return;
            const source = node.moduleSpecifier.text, label = path.relative(root, file);
            if (source === "@gw/shared" || source.includes("tenant-db")) violations.push(label + ": retired dependency " + source);
            if (/\.controller\.ts$/.test(file) && (source.includes(".repository") || source.includes("config/prisma"))) violations.push(label + ": controller accesses persistence");
            if (/\.service\.ts$/.test(file) && source.includes("config/prisma")) violations.push(label + ": service imports raw Prisma client");
            if (!source.startsWith(".")) return;
            const target = resolve(file, source); if (!target) return;
            const to = owner(target);
            if (to && from !== to && path.basename(target) !== "index.ts" && !(file === path.join(root, "app.ts") && target.endsWith(".routes.ts"))) violations.push(label + ": private cross-module import " + source);
            if (from && to && from !== to) { if (!graph.has(from)) graph.set(from, new Set()); graph.get(from)!.add(to); }
        });
    }
    function visit(node: string, trail: string[], complete: Set<string>) {
        if (trail.includes(node)) { violations.push("Module cycle: " + [...trail, node].join(" -> ")); return; }
        if (complete.has(node)) return;
        for (const dependency of graph.get(node) ?? []) visit(dependency, [...trail, node], complete);
        complete.add(node);
    }
    const complete = new Set<string>(); for (const node of graph.keys()) visit(node, [], complete);
    expect(violations).toEqual([]);
});
