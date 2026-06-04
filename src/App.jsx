import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Services from './pages/public/Services'
import Contact from './pages/public/Contact'
import Help from './pages/public/Help'
import Layout from './pages/public/Layout'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import ForgotPassword from './pages/public/ForgotPassword'
import VerifyCode from './pages/public/VerifyCode'
import ResetPassword from './pages/public/ResetPassword'
import ProfileDashboard from './pages/public/dashboard/ProfileDashboard'
import AuthenticatedModuleRoute from './modules/inscriptions/routes/AuthenticatedModuleRoute'
import RoleProtectedRoute from './modules/inscriptions/routes/RoleProtectedRoute'
import InscriptionsPage from './modules/inscriptions/pages/InscriptionsPage'
import CreateInscriptionPage from './modules/inscriptions/pages/CreateInscriptionPage'
import InscriptionDetailPage from './modules/inscriptions/pages/InscriptionDetailPage'
import ClassesPage from './modules/classes/pages/ClassesPage'
import ClasseDetailPage from './modules/classes/pages/ClasseDetailPage'
import ClasseFormPage from './modules/classes/pages/ClasseFormPage'
import AnneesScolairesPage from './modules/anneesScolaires/pages/AnneesScolairesPage'
import CreateAnneeScolairePage from './modules/anneesScolaires/pages/CreateAnneeScolairePage'
import AnneeScolaireDetailPage from './modules/anneesScolaires/pages/AnneeScolaireDetailPage'
import ParentsPage from './modules/parents/pages/ParentsPage'
import CreateParentPage from './modules/parents/pages/CreateParentPage'
import ParentDetailPage from './modules/parents/pages/ParentDetailPage'
import StudentsPage from './modules/students/pages/StudentsPage'
import CreateStudentPage from './modules/students/pages/CreateStudentPage'
import StudentDetailPage from './modules/students/pages/StudentDetailPage'
import AdressesPage from './modules/adresses/pages/AdressesPage'
import CreateAdressePage from './modules/adresses/pages/CreateAdressePage'
import AdresseDetailPage from './modules/adresses/pages/AdresseDetailPage'
import PaiementsPage from './modules/paiements/pages/PaiementsPage'
import CreatePaiementPage from './modules/paiements/pages/CreatePaiementPage'
import PaiementDetailPage from './modules/paiements/pages/PaiementDetailPage'
import DepensesPage from './modules/depenses/pages/DepensesPage'
import CreateDepensePage from './modules/depenses/pages/CreateDepensePage'
import DepenseDetailPage from './modules/depenses/pages/DepenseDetailPage'
import TresoreriePage from './modules/tresorerie/pages/TresoreriePage'
import RapportFinancierAnneePage from './modules/tresorerie/pages/RapportFinancierAnneePage'
import { ADMIN_ROLES, EXPENSE_ROLES, INSCRIPTION_SOLDE_ROLES, PAYMENT_ROLES, TREASURY_ROLES } from './modules/inscriptions/utils/data'
import './App.css'
import './styles/public/PublicTheme.css'
import './modules/inscriptions/styles/inscriptions.css'

function AppLayout () {
  return (
    <main className='main-content'>
      <div className='content-inner'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/services' element={<Services />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/help' element={<Help />} />
          <Route element={<Layout />}>
            <Route path='/dashboard'>
              <Route index element={<Navigate to='profile' replace />} />
              <Route path='profile' element={<ProfileDashboard />} />
            </Route>
            <Route element={<AuthenticatedModuleRoute />}>
              <Route element={<RoleProtectedRoute allowedRoles={ADMIN_ROLES} />}>
                <Route path='/inscriptions' element={<InscriptionsPage />} />
                <Route path='/inscriptions/create' element={<CreateInscriptionPage />} />
                <Route path='/classes' element={<ClassesPage />} />
                <Route path='/classes/create' element={<ClasseFormPage mode='create' />} />
                <Route path='/classes/:id' element={<ClasseDetailPage />} />
                <Route path='/classes/:id/edit' element={<Navigate to='..' replace relative='path' />} />
                <Route path='/annees-scolaires' element={<AnneesScolairesPage />} />
                <Route path='/annees-scolaires/create' element={<CreateAnneeScolairePage />} />
                <Route path='/annees-scolaires/:id' element={<AnneeScolaireDetailPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={INSCRIPTION_SOLDE_ROLES} />}>
                <Route path='/inscriptions/:id' element={<InscriptionDetailPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={PAYMENT_ROLES} />}>
                <Route path='/paiements' element={<PaiementsPage />} />
                <Route path='/paiements/create' element={<CreatePaiementPage />} />
                <Route path='/paiements/:id' element={<PaiementDetailPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={EXPENSE_ROLES} />}>
                <Route path='/depenses' element={<DepensesPage />} />
                <Route path='/depenses/create' element={<CreateDepensePage />} />
                <Route path='/depenses/:id' element={<DepenseDetailPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={TREASURY_ROLES} />}>
                <Route path='/tresorerie' element={<TresoreriePage />} />
                <Route path='/tresorerie/rapport-annee' element={<RapportFinancierAnneePage />} />
              </Route>
              <Route path='/parents' element={<ParentsPage />} />
              <Route path='/parents/create' element={<CreateParentPage />} />
              <Route path='/parents/:id' element={<ParentDetailPage />} />
              <Route path='/students' element={<StudentsPage />} />
              <Route path='/students/create' element={<CreateStudentPage />} />
              <Route path='/students/:id' element={<StudentDetailPage />} />
              <Route path='/adresses' element={<AdressesPage />} />
              <Route path='/adresses/create' element={<CreateAdressePage />} />
              <Route path='/adresses/:id' element={<AdresseDetailPage />} />
            </Route>
          </Route>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/verify-code' element={<VerifyCode />} />
          <Route path='/reset-password' element={<ResetPassword />} />
        </Routes>
      </div>
    </main>
  )
}

function App () {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
