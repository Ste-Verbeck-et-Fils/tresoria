import {
  formatDate,
  getDesignation,
  getInscriptionAnnee,
  getInscriptionClasse,
  getInscriptionStudent,
  getStudentName,
  unwrapEntity,
} from '../../inscriptions/utils/data'
import { formatAmount } from '../../inscriptions/utils/amounts'

export const MOTIF_PAIEMENT_OPTIONS = [
  { value: 'FRAIS_SCOLAIRE', label: 'Frais scolaire' },
  { value: 'FRAIS_TRANSPORT', label: 'Frais transport' },
  { value: 'FRAIS_ETAT', label: 'Frais Etat' },
  { value: 'FRAIS_ETUDE', label: 'Frais etude' },
]

export const MODE_PAIEMENT_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'BANQUE', label: 'Banque' },
]

export const STATUT_PAIEMENT_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'CONFIRME', label: 'Confirme' },
  { value: 'ANNULE', label: 'Annule' },
]

export const DEFAULT_PAIEMENT_FILTERS = {
  statut: '',
  motif: '',
  mode_paiement: '',
  date_debut: '',
  date_fin: '',
  inscription_id: '',
  student_id: '',
  class_id: '',
  annee_scolaire_id: '',
  reference: '',
}

export const normalizePaiementForm = (paiement = {}) => ({
  inscription_id: paiement.inscription_id ?? paiement.inscription?.id ?? '',
  montant: paiement.montant ?? paiement.amount ?? '',
  motif: paiement.motif || paiement.type || 'FRAIS_SCOLAIRE',
  mode_paiement: paiement.mode_paiement || paiement.modePaiement || paiement.mode || 'CASH',
  reference: paiement.reference || paiement.transaction_reference || '',
})

export const unwrapPaiement = (payload) => (
  payload?.paiement ??
  payload?.payment ??
  payload?.data?.paiement ??
  payload?.data?.payment ??
  payload?.data ??
  payload ??
  null
)

export const getPaiementInscription = (paiement) => (
  paiement?.inscription ||
  paiement?.inscription_paiement ||
  paiement?.data?.inscription ||
  null
)

export const isAnneeScolaireCloturee = (inscription) => {
  const anneeScolaire = getInscriptionAnnee(inscription)
  return anneeScolaire?.statut === 'CLOTURE'
}

export const getPaiementMontant = (paiement) => paiement?.montant ?? paiement?.amount

export const getPaiementMotifLabel = (motif) => (
  MOTIF_PAIEMENT_OPTIONS.find((option) => option.value === motif)?.label ||
  String(motif || '-').replace(/_/g, ' ')
)

export const getPaiementModeLabel = (mode) => (
  MODE_PAIEMENT_OPTIONS.find((option) => option.value === mode)?.label ||
  String(mode || '-').replace(/_/g, ' ')
)

export const getPaiementStatus = (paiement) => paiement?.statut || paiement?.status || '-'

export const getPaiementDate = (paiement) => (
  paiement?.date_paiement ||
  paiement?.datePaiement ||
  paiement?.created_at ||
  paiement?.createdAt
)

export const getInscriptionOptionLabel = (inscription) => {
  const student = getInscriptionStudent(inscription)
  const classe = getInscriptionClasse(inscription)
  const anneeScolaire = getInscriptionAnnee(inscription)

  return [
    `#${inscription.id}`,
    getStudentName(student),
    getDesignation(classe, `Classe #${inscription.class_id || '-'}`),
    getDesignation(anneeScolaire, `Annee #${inscription.annee_scolaire_id || '-'}`),
  ].join(' - ')
}

export const validatePaiementForm = (form, selectedInscription) => {
  const errors = {}
  const montant = Number(form.montant)

  if (!form.inscription_id) {
    errors.inscription_id = 'Selectionnez une inscription.'
  } else if (isAnneeScolaireCloturee(selectedInscription)) {
    errors.inscription_id = 'Paiement interdit : l annee scolaire de cette inscription est cloturee.'
  }

  if (form.montant === '') {
    errors.montant = 'Le montant est obligatoire.'
  } else if (Number.isNaN(montant) || montant <= 0) {
    errors.montant = 'Le montant doit etre superieur a zero.'
  }

  if (!form.motif) {
    errors.motif = 'Selectionnez un motif.'
  }

  if (!form.mode_paiement) {
    errors.mode_paiement = 'Selectionnez un mode de paiement.'
  }

  return errors
}

export const getPaiementPayload = (form) => ({
  inscription_id: Number(form.inscription_id),
  montant: Number(form.montant),
  motif: form.motif,
  mode_paiement: form.mode_paiement,
  ...(form.reference.trim() ? { reference: form.reference.trim() } : {}),
})

export const getPaiementSearchText = (paiement) => {
  const inscription = getPaiementInscription(paiement)

  return [
    paiement?.id,
    paiement?.reference,
    paiement?.transaction_reference,
    inscription?.id,
    getStudentName(getInscriptionStudent(inscription)),
    getDesignation(getInscriptionClasse(inscription)),
    getDesignation(getInscriptionAnnee(inscription)),
    getPaiementMotifLabel(paiement?.motif),
    getPaiementModeLabel(paiement?.mode_paiement || paiement?.mode),
    getPaiementStatus(paiement),
    formatAmount(getPaiementMontant(paiement)),
    formatDate(getPaiementDate(paiement)),
  ].join(' ')
}

export const getPaiementFilterParams = (filters = {}) => (
  Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
  )
)

export const hasActivePaiementFilters = (filters = {}) => (
  Object.values(getPaiementFilterParams(filters)).length > 0
)

export const unwrapPaiementEntity = (payload) => unwrapEntity(payload, 'paiement')
