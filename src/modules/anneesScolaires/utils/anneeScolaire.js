export const normalizeAnneeScolaireForm = (annee = {}) => ({
  designation: annee.designation || '',
  frais: annee.frais ?? '',
  budget: annee.budget ?? '',
})

export const unwrapAnneeScolaire = (payload) => (
  payload?.annee_scolaire ??
  payload?.anneeScolaire ??
  payload?.data?.annee_scolaire ??
  payload?.data?.anneeScolaire ??
  payload?.data ??
  payload ??
  null
)

export const validateAnneeScolaireForm = (form) => {
  const errors = {}
  const frais = Number(form.frais)
  const budget = Number(form.budget)

  if (!form.designation.trim()) {
    errors.designation = 'La designation est obligatoire.'
  }

  if (form.frais === '') {
    errors.frais = 'Les frais sont obligatoires.'
  } else if (Number.isNaN(frais) || frais < 0) {
    errors.frais = 'Les frais doivent etre un nombre positif ou nul.'
  }

  if (form.budget === '') {
    errors.budget = 'Le budget est obligatoire.'
  } else if (Number.isNaN(budget) || budget < 0) {
    errors.budget = 'Le budget doit etre un nombre positif ou nul.'
  }

  return errors
}

export const getAnneeScolairePayload = (form) => ({
  designation: form.designation.trim(),
  frais: Number(form.frais),
  budget: Number(form.budget),
})
