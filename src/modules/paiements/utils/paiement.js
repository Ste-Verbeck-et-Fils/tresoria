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
  { value: 'FRAIS_ETUDE', label: 'Frais d\'étude' },
  { value: 'FRAIS_ETAT', label: 'Frais de l\'État' },
  { value: 'FRAIS_TRANSPORT', label: 'Frais de transport' },
  { value: 'AUTRE', label: 'Autres' },
]

export const MODE_PAIEMENT_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
]

export const STATUT_PAIEMENT_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'CONFIRME', label: 'Confirme' },
  { value: 'ANNULE', label: 'Annule' },
]

export const COMPTE_ENTREE_OPTIONS = [
  { value: 'CAISSE_PRINCIPALE', label: 'Caisse principale' },
  { value: 'BANQUE_PRINCIPALE', label: 'Banque principale' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CAISSE_TRANSPORT', label: 'Caisse transport' },
]

export const getCompteDestinationByMotif = (motif) => {
  switch (motif) {
    case 'FRAIS_TRANSPORT':
      return 'Transport'
    case 'FRAIS_SCOLAIRE':
    case 'FRAIS_ETUDE':
      return 'Frais scolaire / Frais d\'étude'
    case 'FRAIS_DIVERS':
      return 'Frais divers'
    case 'FRAIS_ETAT':
      return 'Frais d\'État'
    case 'VENTE':
      return 'Vente'
    case 'AUTRE':
    default:
      return 'Autre'
  }
}

export const MOIS_OPTIONS = [
  { value: 'Janvier', label: 'Janvier' },
  { value: 'Février', label: 'Février' },
  { value: 'Mars', label: 'Mars' },
  { value: 'Avril', label: 'Avril' },
  { value: 'Mai', label: 'Mai' },
  { value: 'Juin', label: 'Juin' },
  { value: 'Juillet', label: 'Juillet' },
  { value: 'Août', label: 'Août' },
  { value: 'Septembre', label: 'Septembre' },
  { value: 'Octobre', label: 'Octobre' },
  { value: 'Novembre', label: 'Novembre' },
  { value: 'Décembre', label: 'Décembre' },
]

const currentYear = new Date().getFullYear()
export const ANNEE_OPTIONS = [
  { value: String(currentYear - 1), label: String(currentYear - 1) },
  { value: String(currentYear), label: String(currentYear) },
  { value: String(currentYear + 1), label: String(currentYear + 1) },
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
  compte_destination_id: paiement.compte_destination_id ?? 'CAISSE_PRINCIPALE',
  date_paiement: paiement.date_paiement ?? new Date().toISOString().split('T')[0],
  
  // Transport fields
  transport_date_debut: paiement.transport_date_debut ?? '',
  transport_nombre_mois: paiement.transport_nombre_mois ?? 1,
  tarif_mensuel_transport: paiement.tarif_mensuel_transport ?? '',
  
  description: paiement.description ?? '',
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

  if (!form.date_paiement) {
    errors.date_paiement = 'La date de l\'entrée est obligatoire.'
  }

  if (form.motif === 'FRAIS_TRANSPORT') {
    if (!form.transport_date_debut) {
      errors.transport_date_debut = 'La date de début est obligatoire.'
    }
    if (!form.transport_nombre_mois || form.transport_nombre_mois < 1) {
      errors.transport_nombre_mois = 'Le nombre de mois doit être au moins 1.'
    }
    if (!form.tarif_mensuel_transport || form.tarif_mensuel_transport <= 0) {
      errors.tarif_mensuel_transport = 'Le tarif mensuel est obligatoire et > 0.'
    }
  }

  return errors
}

export const getPaiementPayload = (form) => ({
  inscription_id: Number(form.inscription_id),
  montant: Number(form.montant),
  motif: form.motif,
  mode_paiement: form.mode_paiement,
  date_paiement: form.date_paiement,
  ...(form.reference.trim() ? { reference: form.reference.trim() } : {}),
  ...(form.description?.trim() ? { description: form.description.trim() } : {}),
  ...(form.motif === 'FRAIS_TRANSPORT' 
      ? { 
          transport_date_debut: form.transport_date_debut,
          transport_nombre_mois: Number(form.transport_nombre_mois),
          transport_date_fin: calculateDateFin(form.transport_date_debut, Number(form.transport_nombre_mois)),
          tarif_mensuel_transport: Number(form.tarif_mensuel_transport),
          montant_attendu: Number(form.transport_nombre_mois) * Number(form.tarif_mensuel_transport)
        } 
      : {}),
  // compte_destination_id: form.compte_destination_id, // To be enabled when backend supports it
})

export const calculateDateFin = (dateDebut, nombreMois) => {
  if (!dateDebut || !nombreMois || nombreMois < 1) return ''
  const date = new Date(dateDebut)
  // Ajoute le nombre de mois
  date.setMonth(date.getMonth() + Number(nombreMois))
  // Retire 1 jour
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

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
