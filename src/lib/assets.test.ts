/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { platformIconSrc } from '../features/multichat/PlatformIcon'
import { shortsIconSrc } from '../features/multichat/ShortsIcon'
import { platforms } from '../features/multichat/types'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(tsx?|css)$/.test(name) && !/\.test\./.test(name) ? [path] : []
  })
}

describe('imagens em /assets', () => {
  it('todo caminho /assets/... escrito no código ou no index.html aponta para um arquivo que existe', () => {
    const files = [...sourceFiles(join(ROOT, 'src')), join(ROOT, 'index.html')]
    const missing: string[] = []
    for (const file of files) {
      for (const match of readFileSync(file, 'utf8').matchAll(/\/assets\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|svg|gif|ico)/g)) {
        if (!existsSync(join(ROOT, 'public', match[0]))) missing.push(`${match[0]} (em ${file.replace(ROOT, '')})`)
      }
    }
    expect(missing).toEqual([])
  })

  it('cada plataforma do multichat tem o ícone que o PlatformIcon monta dinamicamente', () => {
    for (const platform of platforms) {
      expect(existsSync(join(ROOT, 'public', platformIconSrc(platform))), platform).toBe(true)
    }
  })

  it('o ícone oficial do YouTube Shorts existe', () => {
    expect(existsSync(join(ROOT, 'public', shortsIconSrc))).toBe(true)
  })

  it('o diretório não guarda PNG/GIF pesados por engano (exceto os formatos exigidos)', () => {
    const heavy: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        if (statSync(path).isDirectory()) walk(path)
        else if (/\.(png|gif)$/i.test(name) && name !== 'apple-touch-icon.png') heavy.push(path.replace(ROOT, ''))
      }
    }
    walk(join(ROOT, 'public', 'assets'))
    expect(heavy).toEqual([])
  })
})
