import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Eye } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Feedback from '../../../components/ui/Feedback'
import Input from '../../../components/ui/Input'
import { normalizeCollection } from '../utils/data'
import ModuleState from './ModuleState'
import Loader from '../../../components/ui/Loader'
import { getSocket } from '../../../services/socketService'

const DefaultRowActions = ({ item, getRowPath, extraActions, isLast }) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const basePath = getRowPath(item)

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
        <MoreVertical size={20} color='#6b7280' />
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: '100%',
          ...(isLast ? { bottom: '0' } : { top: '0' }),
          background: 'white',
          border: '1px solid #e4e8ef',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 50,
          minWidth: '150px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        >
          <Link to={basePath} style={{ padding: '10px 16px', textDecoration: 'none', color: '#173f5f', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={16} /> Détails
          </Link>
          {extraActions && extraActions(item, { closeMenu: () => setIsOpen(false) })}
        </div>
      )}
    </div>
  )
}

const EntityListPage = ({
  title,
  description,
  loadItems,
  columns,
  emptyMessage,
  createPath,
  createLabel,
  getRowPath,
  searchPlaceholder = 'Rechercher',
  getSearchText,
  searchItems,
  successMessage,
  beforePanel,
  kicker,
  socketEvents,
  rowActions,
  extraActions,
  isLoadingDependencies = false,
}) => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [searchedItems, setSearchedItems] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const payload = await loadItems()
      setItems(normalizeCollection(payload))
      setSearchedItems(null)
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les donnees.')
    } finally {
      setIsLoading(false)
    }
  }, [loadItems])

  const handleSearch = useCallback(async () => {
    if (!searchItems) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const normalizedSearch = search.trim()
      const payload = normalizedSearch
        ? await searchItems(normalizedSearch)
        : await loadItems()
      const normalizedItems = normalizeCollection(payload)

      if (normalizedSearch) {
        setSearchedItems(normalizedItems)
      } else {
        setItems(normalizedItems)
        setSearchedItems(null)
      }
    } catch (searchError) {
      setError(searchError.message || 'Impossible d effectuer la recherche.')
    } finally {
      setIsLoading(false)
    }
  }, [loadItems, search, searchItems])

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setSearchedItems(null)
    setCurrentPage(1)
  }

  useEffect(() => {
    let isCancelled = false

    Promise.resolve()
      .then(() => {
        if (!isCancelled) {
          setIsLoading(true)
          setError('')
          setSearchedItems(null)
        }

        return loadItems()
      })
      .then((payload) => {
        if (!isCancelled) {
          setItems(normalizeCollection(payload))
        }
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(loadError.message || 'Impossible de charger les donnees.')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [loadItems])

  useEffect(() => {
    if (!socketEvents) return

    const socket = getSocket()

    const handleCreated = (newItem) => {
      setItems((prev) => {
        if (prev.find((item) => item.id === newItem.id)) return prev
        return [newItem, ...prev]
      })
      setSearchedItems((prev) => {
        if (!prev) return prev
        if (prev.find((item) => item.id === newItem.id)) return prev
        return [newItem, ...prev]
      })
    }

    const handleUpdated = (updatedItem) => {
      setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
      setSearchedItems((prev) => {
        if (!prev) return prev
        return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      })
    }

    const handleDeleted = (deletedId) => {
      setItems((prev) => prev.filter((item) => item.id !== deletedId))
      setSearchedItems((prev) => {
        if (!prev) return prev
        return prev.filter((item) => item.id !== deletedId)
      })
    }

    if (socketEvents.created) socket.on(socketEvents.created, handleCreated)
    if (socketEvents.updated) socket.on(socketEvents.updated, handleUpdated)
    if (socketEvents.deleted) socket.on(socketEvents.deleted, handleDeleted)

    return () => {
      if (socketEvents.created) socket.off(socketEvents.created, handleCreated)
      if (socketEvents.updated) socket.off(socketEvents.updated, handleUpdated)
      if (socketEvents.deleted) socket.off(socketEvents.deleted, handleDeleted)
    }
  }, [socketEvents])

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const sourceItems = searchedItems ?? items

    if (!normalizedSearch) {
      return sourceItems
    }

    return sourceItems.filter((item) => {
      const searchableValue = getSearchText
        ? getSearchText(item)
        : columns.map((column) => column.render(item)).join(' ')

      return String(searchableValue).toLowerCase().includes(normalizedSearch)
    })
  }, [columns, getSearchText, items, search, searchedItems])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  // Fix current page if it exceeds total pages after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  return (
    <section className='inscription-page' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header className='inscription-page-header'>
        <div>
          {kicker && <p className='inscription-page-kicker'>{kicker}</p>}
          <h1>{title}</h1>
        </div>
        {createPath && createLabel && (
          <Button
            type='button'
            variant='super'
            label={createLabel}
            icon={<Plus size={17} />}
            onClick={() => navigate(createPath)}
            className='inscription-action inscription-action--primary'
          />
        )}
      </header>

      {successMessage && <Feedback type='success' message={successMessage} />}

      {!(isLoading || isLoadingDependencies) && beforePanel}

      <div className='inscription-panel' style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className='inscription-toolbar'>
          <Input
            id={`${title.toLowerCase().replace(/\s+/g, '-')}-search`}
            type='search'
            variant='searchbox'
            placeholder={searchPlaceholder}
            value={search}
            icon={<Search size={18} />}
            onChange={handleSearchChange}
            onSearch={searchItems ? handleSearch : undefined}
            onKeyDown={(event) => {
              if (searchItems && event.key === 'Enter') {
                event.preventDefault()
                handleSearch()
              }
            }}
            className='inscription-search'
          />
          <span className='inscription-count'>{filteredItems.length} element(s)</span>
        </div>

        {(isLoading || isLoadingDependencies) && (
          <Loader message='Chargement en cours...' />
        )}

        {!(isLoading || isLoadingDependencies) && error && (
          <ModuleState
            type='error'
            title='Echec du chargement'
            message={error}
            actionLabel='Reessayer'
            onAction={searchItems ? handleSearch : load}
          />
        )}

        {!(isLoading || isLoadingDependencies) && !error && filteredItems.length === 0 && (
          <ModuleState
            title='Aucun resultat'
            message={search ? 'Aucun element ne correspond a votre recherche.' : emptyMessage}
          />
        )}

        {!(isLoading || isLoadingDependencies) && !error && filteredItems.length > 0 && (
          <>
            <div className='inscription-table-wrapper' style={{ flex: 1, overflowY: 'auto' }}>
              <table className='inscription-table'>
                <thead>
                  <tr>
                    {columns.map((column) => <th key={column.label}>{column.label}</th>)}
                    {(getRowPath || rowActions) && <th className='inscription-table__action-heading'>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, index) => (
                    <tr key={item.id}>
                      {columns.map((column) => <td key={column.label}>{column.render(item)}</td>)}
                      {(getRowPath || rowActions) && (
                        <td className='inscription-table__action'>
                          {rowActions
                            ? rowActions(item)
                            : (
                                getRowPath && <DefaultRowActions item={item} getRowPath={getRowPath} extraActions={extraActions} isLast={index >= paginatedItems.length - 2} />
                              )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #edf0f4' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredItems.length)} sur {filteredItems.length}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant='outline'
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  label='Precedent'
                />
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.85rem', color: '#334155', fontWeight: 'bold' }}>
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant='outline'
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  label='Suivant'
                />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default EntityListPage
