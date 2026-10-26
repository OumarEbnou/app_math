/// <reference types="node" />

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(process.cwd(), '..')
const migrationDirectory = resolve(projectRoot, 'supabase', 'migrations')
const migrationFiles = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort()
const migrations = migrationFiles
  .map((name) => readFileSync(resolve(migrationDirectory, name), 'utf8'))
  .join('\n')

function readSourceTree(directory: string): string {
  return readdirSync(directory)
    .filter((entry) => !entry.includes('.test.'))
    .map((entry) => {
      const path = resolve(directory, entry)
      if (statSync(path).isDirectory()) return readSourceTree(path)
      return /\.tsx?$/.test(entry) ? readFileSync(path, 'utf8') : ''
    })
    .join('\n')
}

describe('contrat de sécurité de livraison', () => {
  it('conserve l’ordre complet des migrations', () => {
    expect(migrationFiles).toEqual([
      '202610230001_initial_schema.sql',
      '202610230002_admin_security.sql',
      '202610230003_single_table_game.sql',
      '202610240004_all_tables_and_leaderboards.sql',
      '202610250005_username_auth.sql',
    ])
  })

  it.each([
    'profiles',
    'game_settings',
    'game_sessions',
    'game_answers',
    'audit_logs',
    'game_attempts',
  ])('active la RLS sur %s', (table) => {
    expect(migrations).toContain(`alter table public.${table} enable row level security;`)
  })

  it('retire les écritures directes sensibles au rôle authenticated', () => {
    expect(migrations).toContain('revoke update on public.profiles from authenticated;')
    expect(migrations).toContain(
      'revoke insert, update, delete on public.game_sessions from authenticated;',
    )
    expect(migrations).toContain(
      'revoke insert, update, delete on public.game_answers from authenticated;',
    )
    expect(migrations).toContain('revoke all on public.game_attempts from anon, authenticated;')
  })

  it('durcit chaque fonction SECURITY DEFINER avec un search_path vide', () => {
    const definerFunctions = migrations.match(/security definer/gi) ?? []
    const hardenedFunctions = migrations.match(/security definer\s+set search_path = ''/gi) ?? []
    expect(definerFunctions.length).toBeGreaterThan(0)
    expect(hardenedFunctions).toHaveLength(definerFunctions.length)
  })

  it('n’inclut aucune valeur service_role dans le front-end', () => {
    const source = readSourceTree(resolve(process.cwd(), 'src'))
    expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY')

    const environmentLines = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
    expect(environmentLines.every((line) => line.startsWith('VITE_'))).toBe(true)
  })
})
