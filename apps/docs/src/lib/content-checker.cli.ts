import { checkContent, formatDiagnostics } from "./content-checker"

const fix = process.argv.includes("--fix")
const diagnostics = checkContent({ root: process.cwd(), fix })
const output = formatDiagnostics(diagnostics)

if (diagnostics.length > 0) {
  console.error(output)
  process.exit(1)
}

console.log(output)
