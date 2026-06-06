import { formatDate, getDesignation } from '../../inscriptions/utils/data'
import { toAmount } from '../../inscriptions/utils/amounts'

const AMOUNT_KEYS = {
  entreesComptabilisables: [
    'entrees_comptabilisables',
    'entreesComptabilisables',
    'total_entrees_comptabilisables',
    'totalEntreesComptabilisables',
    'total_entrees',
    'totalEntrees',
    'entrees',
    'recettes',
    'paiements_confirmes',
    'total_paiements',
  ],
  sortiesConfirmees: [
    'sorties_confirmees',
    'sortiesConfirmees',
    'total_sorties_confirmees',
    'totalSortiesConfirmees',
    'total_sorties',
    'totalSorties',
    'sorties',
    'depenses_confirmees',
    'total_depenses',
    'depenses',
  ],
  soldeTresorerie: [
    'solde_tresorerie',
    'soldeTresorerie',
    'solde',
    'balance',
    'resultat',
    'tresorerie',
  ],
}

const REPORT_AMOUNT_KEYS = {
  paiementsComptabilisables: [
    'paiements_comptabilisables',
    'paiementsComptabilisables',
    'total_paiements_comptabilisables',
    'totalPaiementsComptabilisables',
    'entrees_comptabilisables',
    'total_entrees_comptabilisables',
  ],
  paiementsNonComptabilisables: [
    'paiements_non_comptabilisables',
    'paiementsNonComptabilisables',
    'total_paiements_non_comptabilisables',
    'totalPaiementsNonComptabilisables',
    'entrees_non_comptabilisables',
    'total_entrees_non_comptabilisables',
  ],
  depensesConfirmees: [
    'depenses_confirmees',
    'depensesConfirmees',
    'total_depenses_confirmees',
    'totalDepensesConfirmees',
    'sorties_confirmees',
    'total_sorties_confirmees',
  ],
  depensesAnnulees: [
    'depenses_annulees',
    'depensesAnnulees',
    'total_depenses_annulees',
    'totalDepensesAnnulees',
    'sorties_annulees',
    'total_sorties_annulees',
  ],
  soldeFinal: [
    'solde_final',
    'soldeFinal',
    'solde',
    'solde_tresorerie',
    'balance',
  ],
}

const GROUP_KEYS = {
  paiementsParMotif: [
    'paiements_groupes_par_motif',
    'paiementsParMotif',
    'paiements_par_motif',
    'paiementsByMotif',
    'groupes_paiements_motif',
  ],
  depensesParCategorie: [
    'depenses_groupes_par_categorie',
    'depensesParCategorie',
    'depenses_par_categorie',
    'depensesByCategorie',
    'depensesByCategory',
  ],
  paiementsParMode: [
    'paiements_groupes_par_mode_paiement',
    'paiementsParModePaiement',
    'paiements_par_mode_paiement',
    'paiementsByModePaiement',
    'paiementsByMode',
  ],
  depensesParMode: [
    'depenses_groupes_par_mode_paiement',
    'depensesParModePaiement',
    'depenses_par_mode_paiement',
    'depensesByModePaiement',
    'depensesByMode',
  ],
}

export const DEFAULT_TRESORERIE_FILTERS = {
  annee_scolaire_id: '',
  start_date: '',
  end_date: '',
}

export const unwrapTresorerie = (payload) => (
  payload?.tresorerie ??
  payload?.treasury ??
  payload?.resume ??
  payload?.data?.tresorerie ??
  payload?.data?.treasury ??
  payload?.data?.resume ??
  payload?.data ??
  payload ??
  null
)

export const unwrapRapportFinancier = (payload) => (
  payload?.rapport ??
  payload?.report ??
  payload?.rapport_financier ??
  payload?.rapportFinancier ??
  payload?.data?.rapport ??
  payload?.data?.report ??
  payload?.data?.rapport_financier ??
  payload?.data?.rapportFinancier ??
  payload?.data ??
  payload ??
  null
)

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

const pickValue = (sources, keys) => {
  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue
    }

    for (const key of keys) {
      if (source[key] !== null && source[key] !== undefined) {
        return source[key]
      }
    }
  }

  return null
}

export const getTresorerieSummary = (payload) => {
  const tresorerie = unwrapTresorerie(payload)
  const sources = [
    tresorerie,
    tresorerie?.resume,
    tresorerie?.totaux,
    tresorerie?.totals,
    payload,
  ]
  const entreesComptabilisables = pickAmount(sources, AMOUNT_KEYS.entreesComptabilisables)
  const sortiesConfirmees = pickAmount(sources, AMOUNT_KEYS.sortiesConfirmees)
  const soldeTresorerie = pickAmount(sources, AMOUNT_KEYS.soldeTresorerie) ?? (
    entreesComptabilisables !== null && sortiesConfirmees !== null
      ? entreesComptabilisables - sortiesConfirmees
      : null
  )

  return {
    entreesComptabilisables,
    sortiesConfirmees,
    soldeTresorerie,
  }
}

export const getTresorerieFilterMode = (filters = {}) => {
  if (filters.start_date || filters.end_date) {
    return 'periode'
  }

  if (filters.annee_scolaire_id) {
    return 'annee'
  }

  return 'global'
}

export const getTresorerieScopeLabel = (filters = {}, anneesScolaires = []) => {
  const mode = getTresorerieFilterMode(filters)

  if (mode === 'periode') {
    return `Periode du ${formatDate(filters.start_date)} au ${formatDate(filters.end_date)}`
  }

  if (mode === 'annee') {
    const annee = anneesScolaires.find((item) => String(item.id) === String(filters.annee_scolaire_id))
    return getDesignation(annee, `Annee scolaire #${filters.annee_scolaire_id}`)
  }

  return 'Vue globale'
}

export const validateTresorerieFilters = (filters = {}) => {
  if ((filters.start_date && !filters.end_date) || (!filters.start_date && filters.end_date)) {
    return 'Renseignez la date de debut et la date de fin pour filtrer par periode.'
  }

  if (
    filters.start_date &&
    filters.end_date &&
    new Date(filters.start_date) > new Date(filters.end_date)
  ) {
    return 'La date de debut doit etre anterieure ou egale a la date de fin.'
  }

  return ''
}

const normalizeGroupEntries = (value, fallbackLabel = '-') => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => ({
      label: item.label || item.libelle || item.motif || item.categorie || item.category || item.mode_paiement || item.mode || item.nom || `${fallbackLabel} ${index + 1}`,
      montant: item.montant ?? item.total ?? item.amount ?? item.valeur ?? item.value,
      count: item.count ?? item.nombre ?? item.total_count ?? item.totalCount,
    }))
  }

  if (typeof value === 'object') {
    return Object.entries(value).map(([label, rawValue]) => {
      if (rawValue && typeof rawValue === 'object') {
        return {
          label,
          montant: rawValue.montant ?? rawValue.total ?? rawValue.amount ?? rawValue.valeur ?? rawValue.value,
          count: rawValue.count ?? rawValue.nombre ?? rawValue.total_count ?? rawValue.totalCount,
        }
      }

      return { label, montant: rawValue, count: null }
    })
  }

  return []
}

export const getRapportFinancierSummary = (payload) => {
  const rapport = unwrapRapportFinancier(payload)
  const sources = [
    rapport,
    rapport?.resume,
    rapport?.totaux,
    rapport?.totals,
    payload,
  ]
  const paiementsComptabilisables = pickAmount(sources, REPORT_AMOUNT_KEYS.paiementsComptabilisables)
  const paiementsNonComptabilisables = pickAmount(sources, REPORT_AMOUNT_KEYS.paiementsNonComptabilisables)
  const depensesConfirmees = pickAmount(sources, REPORT_AMOUNT_KEYS.depensesConfirmees)
  const depensesAnnulees = pickAmount(sources, REPORT_AMOUNT_KEYS.depensesAnnulees)
  const soldeFinal = pickAmount(sources, REPORT_AMOUNT_KEYS.soldeFinal) ?? (
    paiementsComptabilisables !== null && depensesConfirmees !== null
      ? paiementsComptabilisables - depensesConfirmees
      : null
  )

  return {
    paiementsComptabilisables,
    paiementsNonComptabilisables,
    depensesConfirmees,
    depensesAnnulees,
    soldeFinal,
  }
}

export const getRapportFinancierGroups = (payload) => {
  const rapport = unwrapRapportFinancier(payload)
  const sources = [
    rapport,
    rapport?.groupes,
    rapport?.groups,
    rapport?.details,
    payload,
  ]

  return {
    paiementsParMotif: normalizeGroupEntries(
      pickValue(sources, GROUP_KEYS.paiementsParMotif),
      'Motif'
    ),
    depensesParCategorie: normalizeGroupEntries(
      pickValue(sources, GROUP_KEYS.depensesParCategorie),
      'Categorie'
    ),
    paiementsParMode: normalizeGroupEntries(
      pickValue(sources, GROUP_KEYS.paiementsParMode),
      'Mode'
    ),
    depensesParMode: normalizeGroupEntries(
      pickValue(sources, GROUP_KEYS.depensesParMode),
      'Mode'
    ),
  }
}
