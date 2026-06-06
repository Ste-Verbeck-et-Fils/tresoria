import {
  formatDate,
  formatDateForApi,
  getDesignation,
  unwrapEntity,
} from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'

export const DEFAULT_DEPENSE_FORM = {
  annee_scolaire_id: '',
  montant: '',
  motif: '',
  description: '',
  date_depense: '',
  reference: '',
}

export const MODE_DEPENSE_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'BANQUE', label: 'Banque' },
]

export const STATUT_DEPENSE_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'VALIDEE', label: 'Validee' },
  { value: 'CONFIRMEE', label: 'Confirmee' },
  { value: 'ANNULEE', label: 'Annulee' },
]

export const DEFAULT_DEPENSE_FILTERS = {
  statut: '',
  categorie: '',
  mode_paiement: '',
  date_debut: '',
  date_fin: '',
  annee_scolaire_id: '',
  reference: '',
  beneficiaire: '',
}

const normalizeDateInput = (value) => (value ? String(value).slice(0, 10) : '')

export const normalizeDepenseForm = (depense = {}) => ({
  annee_scolaire_id: depense.annee_scolaire_id ?? depense.anneeScolaireId ?? depense.annee_scolaire?.id ?? '',
  montant: depense.montant ?? depense.amount ?? '',
  motif: depense.motif || depense.type || '',
  description: depense.description || depense.observation || '',
  date_depense: normalizeDateInput(depense.date_depense || depense.dateDepense),
  reference: depense.reference || depense.transaction_reference || '',
})

export const unwrapDepense = (payload) => (
  payload?.depense ??
  payload?.expense ??
  payload?.data?.depense ??
  payload?.data?.expense ??
  payload?.data ??
  payload ??
  null
)

export const getDepenseAnneeScolaire = (depense) => (
  depense?.annee_scolaire ||
  depense?.anneeScolaire ||
  depense?.annee ||
  depense?.data?.annee_scolaire ||
  null
)

export const isAnneeScolaireCloturee = (anneeScolaire) => {
  const statut = anneeScolaire?.statut || anneeScolaire?.status
  return statut === 'CLOTURE'
}

export const getAnneeScolaireOptionLabel = (anneeScolaire) => (
  [
    `#${anneeScolaire.id}`,
    getDesignation(anneeScolaire, `Annee #${anneeScolaire.id}`),
    anneeScolaire.statut || anneeScolaire.status,
  ].filter(Boolean).join(' - ')
)

export const getDepenseMontant = (depense) => depense?.montant ?? depense?.amount

export const getDepenseDate = (depense) => (
  depense?.date_depense ||
  depense?.dateDepense ||
  depense?.created_at ||
  depense?.createdAt
)

export const getDepenseStatus = (depense) => depense?.statut || depense?.status || '-'

export const getDepenseCategorie = (depense) => depense?.categorie || depense?.category || depense?.motif

export const getDepenseModePaiement = (depense) => depense?.mode_paiement || depense?.modePaiement || depense?.mode

export const getDepenseBeneficiaire = (depense) => depense?.beneficiaire || depense?.beneficiary || depense?.fournisseur

export const validateDepenseForm = (form, selectedAnneeScolaire) => {
  const errors = {}
  const montant = Number(form.montant)

  if (!form.annee_scolaire_id) {
    errors.annee_scolaire_id = 'Selectionnez une annee scolaire.'
  } else if (isAnneeScolaireCloturee(selectedAnneeScolaire)) {
    errors.annee_scolaire_id = 'Depense interdite : l annee scolaire selectionnee est cloturee.'
  }

  if (form.montant === '') {
    errors.montant = 'Le montant est obligatoire.'
  } else if (Number.isNaN(montant) || montant <= 0) {
    errors.montant = 'Le montant doit etre superieur a zero.'
  }

  if (!form.motif.trim()) {
    errors.motif = 'Le motif est obligatoire.'
  }

  if (!form.date_depense) {
    errors.date_depense = 'La date de depense est obligatoire.'
  }

  return errors
}

export const getDepensePayload = (form) => ({
  annee_scolaire_id: Number(form.annee_scolaire_id),
  montant: Number(form.montant),
  motif: form.motif.trim(),
  date_depense: form.date_depense,
  ...(form.description.trim() ? { description: form.description.trim() } : {}),
  ...(form.reference.trim() ? { reference: form.reference.trim() } : {}),
})

export const getDepenseSearchText = (depense) => {
  const anneeScolaire = getDepenseAnneeScolaire(depense)

  return [
    depense?.id,
    depense?.reference,
    depense?.transaction_reference,
    getDesignation(anneeScolaire, `Annee #${depense?.annee_scolaire_id || '-'}`),
    depense?.motif,
    getDepenseCategorie(depense),
    getDepenseModePaiement(depense),
    getDepenseBeneficiaire(depense),
    depense?.description,
    getDepenseStatus(depense),
    formatAmount(getDepenseMontant(depense)),
    formatDate(getDepenseDate(depense)),
  ].join(' ')
}

export const getDepenseFilterParams = (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
  )

  if (params.date_debut) {
    params.date_debut = formatDateForApi(params.date_debut)
  }

  if (params.date_fin) {
    params.date_fin = formatDateForApi(params.date_fin)
  }

  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined))
}

export const hasActiveDepenseFilters = (filters = {}) => (
  Object.values(getDepenseFilterParams(filters)).length > 0
)

export const unwrapDepenseEntity = (payload) => unwrapEntity(payload, 'depense')
