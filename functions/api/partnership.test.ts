import { describe, expect, it } from 'vitest'
import { parsePartnershipSubmission } from './partnership'
import { partnershipEmailHtml } from '../lib/emailTemplates'

const validSubmission = {
  company: 'Marca Exemplo',
  name: 'Ana Responsável',
  email: 'contato@marcaexemplo.com.br',
  phone: '(11) 99999-9999',
  partnershipType: 'campaignSpecialAction' as const,
  message: 'Gostaríamos de apresentar uma campanha para a comunidade.',
}

describe('parsePartnershipSubmission', () => {
  it('aceita uma proposta comercial completa e remove espaços das extremidades', () => {
    expect(parsePartnershipSubmission({ ...validSubmission, company: '  Marca Exemplo  ' })).toEqual(validSubmission)
  })

  it.each(['company', 'name', 'email', 'partnershipType', 'message'] as const)(
    'rejeita proposta sem %s',
    (field) => {
      expect(parsePartnershipSubmission({ ...validSubmission, [field]: '' })).toBeNull()
    },
  )

  it('rejeita tipo de parceria fora das opções comerciais', () => {
    expect(parsePartnershipSubmission({ ...validSubmission, partnershipType: 'randomTrade' })).toBeNull()
  })

  it('mantém o WhatsApp opcional', () => {
    expect(parsePartnershipSubmission({ ...validSubmission, phone: '' })).toEqual({ ...validSubmission, phone: '' })
  })

  it('limita os campos ao tamanho aceito pela API', () => {
    const submission = parsePartnershipSubmission({ ...validSubmission, company: 'a'.repeat(250) })
    expect(submission?.company).toHaveLength(200)
  })
})

describe('partnershipEmailHtml', () => {
  it('inclui os dados comerciais e escapa conteúdo inserido pelo visitante', () => {
    const html = partnershipEmailHtml({ ...validSubmission, company: '<Marca & Cia>', message: '<script>alert(1)</script>' })

    expect(html).toContain('Empresa / marca')
    expect(html).toContain('Tipo de parceria')
    expect(html).toContain('Campanha / ação especial')
    expect(html).toContain('&lt;Marca &amp; Cia&gt;')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })
})
