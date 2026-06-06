import { formatNumber } from './data'

const AMOUNT_KEYS = {
  frais: [
    'frais_annee_scolaire',
    'fraisAnneeScolaire',
    'frais_scolaire',
    'frais',
    'montant_frais',
  ],
  detteReportee: [
    'dette_reportee',
    'detteReportee',
    'ancienne_dette',
    'ancienneDette',
    'dette_restante_reportee',
  ],
  totalAPayer: [
    'total_a_payer',
    'totalAPayer',
    'montant_total',
    'montantTotal',
    'total',
  ],
  montantPaye: [
    'montant_paye',
    'montantPaye',
    'total_paye',
    'totalPaye',
    'paye',
  ],
  resteAPayer: [
    'reste_a_payer',
    'resteAPayer',
    'solde_restant',
    'soldeRestant',
    'dette_restante',
    'solde',
  ],
}

export const unwrapInscriptionSolde = (payload) => (
  payload?.solde ??
  payload?.data?.solde ??
  payload?.data ??
  payload ??
  null
)

export const toAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const amount = Number(value)

  return Number.isNaN(amount) ? null : amount
}

const pickAmount = (sources, keys) => {
  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue
    }

    for (const key of keys) {
      const amount = toAmount(source[key])

      if (amount !== null) {
        return amount
      }
    }
  }

  return null
}

export const formatAmount = (value) => {
  const amount = toAmount(value)

  return amount === null ? '-' : formatNumber(amount)
}

export const getInscriptionFinancialSummary = (inscription = {}, soldePayload = null) => {
  const solde = unwrapInscriptionSolde(soldePayload)
  const anneeScolaire = inscription?.annee_scolaire || inscription?.anneeScolaire || null
  const sources = [solde, inscription, anneeScolaire]
  const frais = pickAmount(sources, AMOUNT_KEYS.frais)
  const detteReportee = pickAmount(sources, AMOUNT_KEYS.detteReportee) ?? 0
  const totalAPayer = pickAmount(sources, AMOUNT_KEYS.totalAPayer) ??
    (frais !== null ? frais + detteReportee : null)
  const montantPaye = pickAmount(sources, AMOUNT_KEYS.montantPaye)
  const resteAPayer = pickAmount(sources, AMOUNT_KEYS.resteAPayer) ??
    (totalAPayer !== null && montantPaye !== null ? totalAPayer - montantPaye : null)

  return {
    frais,
    detteReportee,
    totalAPayer,
    montantPaye,
    resteAPayer,
  }
}

export const getSoldePreviewFromSummary = (summary) => ({
  frais_annee_scolaire: summary.frais,
  dette_reportee: summary.detteReportee,
  total_a_payer: summary.totalAPayer,
  montant_paye: summary.montantPaye,
  reste_a_payer: summary.resteAPayer,
})
