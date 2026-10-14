import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { DataProvider } from './db/DataContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { MonthlySummary } from './pages/MonthlySummary'
import { Routine } from './pages/Routine'
import { Orders } from './pages/Orders'
import { Payments } from './pages/Payments'
import { ProductionCosts } from './pages/ProductionCosts'
import { Cashbook } from './pages/Cashbook'
import { Expenses } from './pages/Expenses'
import { Suppliers } from './pages/Suppliers'
import { Inventory } from './pages/Inventory'
import { Pricing } from './pages/Pricing'
import { TaxTracker } from './pages/TaxTracker'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <LanguageProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/monthly" element={<MonthlySummary />} />
              <Route path="/routine" element={<Routine />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/production" element={<ProductionCosts />} />
              <Route path="/cashbook" element={<Cashbook />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/tax" element={<TaxTracker />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </DataProvider>
    </LanguageProvider>
  )
}
