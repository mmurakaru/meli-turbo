import { type EnvironmentVariableSpec, environmentVariableRegistry } from '../src/runtime/config.ts'

/** Renders the environment-variable reference from the Config definition itself. */
export function renderEnvironmentVariableDocs(): string {
  const groups = new Map<string, Array<EnvironmentVariableSpec>>()
  for (const spec of environmentVariableRegistry) {
    const group = groups.get(spec.group) ?? []
    group.push(spec)
    groups.set(spec.group, group)
  }

  const lines: Array<string> = [
    '# Environment variables',
    '',
    'Generated from `src/runtime/config.ts` by `node --run docs:generate` - do not edit by hand.',
  ]
  for (const [group, specs] of groups) {
    lines.push(
      '',
      `## ${group}`,
      '',
      '| Variable | Default | Secret | Description |',
      '|---|---|---|---|',
    )
    for (const spec of specs) {
      const defaultValue = spec.defaultValue ?? (spec.optional ? '*(unset)*' : '**required**')
      lines.push(
        `| \`${spec.name}\` | ${defaultValue} | ${spec.secret ? 'yes' : ''} | ${spec.description} |`,
      )
    }
  }
  lines.push('')
  return lines.join('\n')
}
