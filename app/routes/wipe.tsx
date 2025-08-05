"use client"

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { usePuterStore } from "~/lib/puter"

function formatDate(ts?: number) {
  if (!ts) return "-"
  return new Date(ts).toLocaleString()
}

function formatSize(bytes?: number | null) {
  if (!bytes) return "0 KB"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const FILE_ICONS: Record<string, string> = {
  pdf: "/icons/info.svg",
  png: "/icons/pin.svg",
  jpg: "/icons/pin.svg",
  jpeg: "/icons/pin.svg",
  gif: "/icons/pin.svg",
  default: "/icons/pin.svg",
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || ""
  return FILE_ICONS[ext] || FILE_ICONS.default
}

const isImage = (name: string) => /\.(png|jpe?g|gif)$/i.test(name)
const isPDF = (name: string) => /\.pdf$/i.test(name)

// Minimal FSItem type for local use
type FSItem = {
  id: string | number
  name: string
  path: string
  size?: number | null
  modified?: number | null
}

const WipeApp = () => {
  const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore()
  const navigate = useNavigate()
  const [files, setFiles] = useState<FSItem[]>([])
  const [wiping, setWiping] = useState(false)
  const [wiped, setWiped] = useState(false)
  const [wipeProgress, setWipeProgress] = useState<{
    current: number
    total: number
    name: string
    errors: { name: string; error: string }[]
  }>({ current: 0, total: 0, name: "", errors: [] })
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [fileToDelete, setFileToDelete] = useState<FSItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<FSItem | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null)
  const previewModalRef = useRef<HTMLDivElement>(null)

  const loadFiles = async () => {
    const files = (await fs.readDir("./")) as FSItem[] | undefined
    setFiles(files || [])
  }

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/wipe")
    }
  }, [isLoading])

  // File preview logic
  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null)
      setPreviewType(null)
      return
    }
    ;(async () => {
      try {
        const blob = await fs.read(previewFile.path)
        if (!blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        if (isImage(previewFile.name)) setPreviewType("image")
        else if (isPDF(previewFile.name)) setPreviewType("pdf")
        else setPreviewType(null)
      } catch {
        setPreviewUrl(null)
        setPreviewType(null)
      }
    })()
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line
  }, [previewFile])

  // Keyboard navigation for preview modal
  useEffect(() => {
    if (!previewFile) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewFile(null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [previewFile])

  // Confirmation modal focus trap
  const confirmInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (showConfirm && confirmInputRef.current) {
      confirmInputRef.current.focus()
    }
  }, [showConfirm])

  // Wipe all files with progress
  const handleWipeAll = async () => {
    setWiping(true)
    setWiped(false)
    setWipeProgress({ current: 0, total: files.length, name: "", errors: [] })
    for (let i = 0; i < files.length; i++) {
      setWipeProgress((p) => ({ ...p, current: i + 1, name: files[i].name }))
      try {
        await fs.delete(files[i].path)
      } catch (err: any) {
        setWipeProgress((p) => ({
          ...p,
          errors: [...p.errors, { name: files[i].name, error: err?.message || "Unknown error" }],
        }))
      }
    }
    await kv.flush()
    setWiping(false)
    setWiped(true)
    setShowConfirm(false)
    setConfirmText("")
    loadFiles()
  }

  // Individual file delete
  const handleDeleteFile = async (file: FSItem) => {
    setFileToDelete(file)
    setDeleteError(null)
  }
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return
    try {
      await fs.delete(fileToDelete.path)
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id))
      setFileToDelete(null)
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete file")
    }
  }

  // File preview modal
  const openPreview = (file: FSItem) => setPreviewFile(file)
  const closePreview = () => setPreviewFile(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 pb-24">
      {/* Top Header Bar with User Info */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-white/30 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/icons/warning.svg" alt="Warning" className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Management Dashboard</h1>
                <p className="text-sm text-gray-600">Manage and wipe your application data</p>
              </div>
            </div>
            {/* User Info Card in Header */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{auth.user?.username?.[0]?.toUpperCase() || "?"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600">Authenticated as</span>
                <span className="text-sm font-semibold text-blue-700">{auth.user?.username}</span>
              </div>
              <div className="ml-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{files.length}</p>
                <p className="text-sm text-gray-600">Total Files</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatSize(files.reduce((acc, file) => acc + (file.size || 0), 0))}
                </p>
                <p className="text-sm text-gray-600">Total Size</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {files.length > 0 ? formatDate(Math.max(...files.map((f) => f.modified || 0))).split(",")[0] : "-"}
                </p>
                <p className="text-sm text-gray-600">Last Modified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar (when wiping) */}
        {wiping && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/30 mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Wiping Data...</h3>
                <span className="text-sm text-gray-600">
                  {wipeProgress.current}/{wipeProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-400 to-pink-400 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(wipeProgress.current / (wipeProgress.total || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-700">
                Deleting: <span className="font-semibold">{wipeProgress.name}</span>
              </div>
              {wipeProgress.errors.length > 0 && (
                <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="font-semibold mb-1">Errors occurred:</div>
                  {wipeProgress.errors.map((e) => (
                    <div key={e.name}>
                      • {e.name}: {e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {wiped && !wiping && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 shadow-sm">
            <div className="flex items-center gap-2 text-green-700">
              <img src="/icons/check.svg" alt="Success" className="w-5 h-5" />
              <span className="font-semibold">Data wiped successfully!</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 shadow-sm">
            <div className="flex items-center gap-2 text-red-700">
              <img src="/icons/cross.svg" alt="Error" className="w-5 h-5" />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Files Section with Enhanced Dashboard Feel */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 overflow-hidden min-h-[500px]">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-blue-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Files</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on any file to preview • Hover to reveal delete option
                </p>
              </div>
              <div className="text-sm text-gray-500 bg-white/70 px-3 py-1 rounded-full">
                {files.length} {files.length === 1 ? "file" : "files"}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-gray-50/30 to-blue-50/20 min-h-[400px]">
            {files.length === 0 ? (
              <div className="text-center py-20">
                {/* Enhanced Empty State with Illustration */}
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <svg
                    className="w-16 h-16 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No files found</h3>
                <p className="text-gray-500 text-lg mb-2">Your storage directory is currently empty.</p>
                <p className="text-gray-400 text-sm">Upload some files to see them appear here!</p>
                <div className="mt-8 flex justify-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                    <span className="text-blue-600 text-sm font-medium">✨ Clean slate ready for new data</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="group flex items-center gap-4 p-5 bg-white/80 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200 border border-gray-200/50 hover:border-blue-300 cursor-pointer"
                    onClick={() => openPreview(file)}
                  >
                    <div className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1">
                      <img
                        src={getFileIcon(file.name) || "/placeholder.svg"}
                        alt="file"
                        className="w-10 h-10 opacity-80 group-hover:scale-110 transition-transform"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-blue-900 transition-colors">
                            {file.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="font-medium">{formatSize(file.size)}</span>
                            <span>•</span>
                            <span>{formatDate(file.modified ?? undefined)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span>Active</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className="ml-2 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50"
                      aria-label={`Delete ${file.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(file)
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Danger Zone Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-red-50 to-pink-50 border-t border-red-200 shadow-lg backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                <p className="text-sm text-red-700">
                  Permanently delete all {files.length} files • This action cannot be undone
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse hover:animate-none"
              onClick={() => setShowConfirm(true)}
              disabled={wiping || files.length === 0}
              aria-label="Wipe all application data - this action cannot be undone"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm-2 6h8m-6 4h4"
                />
              </svg>
              <span>Wipe All App Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Wipe All */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-4 animate-in fade-in duration-200 border border-red-200">
            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <img src="/icons/warning.svg" className="w-6 h-6" /> Confirm Wipe
            </h2>
            <p className="text-gray-700">
              This will permanently delete <span className="font-semibold">all {files.length} files</span> and cannot be
              undone. To confirm, type <span className="font-mono bg-gray-100 px-2 py-1 rounded">DELETE</span> below:
            </p>
            <input
              ref={confirmInputRef}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              aria-label="Type DELETE to confirm deletion of all files"
            />
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={() => {
                  setShowConfirm(false)
                  setConfirmText("")
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
                disabled={confirmText !== "DELETE" || wiping}
                onClick={handleWipeAll}
              >
                {wiping ? "Wiping..." : "Confirm Wipe"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual File Delete Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-4 animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <img src="/icons/warning.svg" className="w-6 h-6" /> Delete File
            </h2>
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{fileToDelete.name}</span>?
            </p>
            {deleteError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{deleteError}</div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={() => {
                  setFileToDelete(null)
                  setDeleteError(null)
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={confirmDeleteFile}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && previewUrl && previewType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          tabIndex={-1}
          ref={previewModalRef}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col gap-4 relative animate-in fade-in duration-200">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 z-10 bg-white rounded-full p-2 shadow-lg transition-colors"
              onClick={closePreview}
              aria-label="Close preview"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="pr-12">
              <h3 className="text-xl font-semibold text-gray-900">{previewFile.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {formatSize(previewFile.size)} • {formatDate(previewFile.modified ?? undefined)}
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              {previewType === "image" && (
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt={previewFile.name}
                  className="max-w-full max-h-full w-auto h-auto mx-auto rounded shadow-lg"
                />
              )}
              {previewType === "pdf" && (
                <iframe
                  src={previewUrl}
                  title={previewFile.name}
                  className="w-full h-[70vh] rounded shadow-lg border"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WipeApp
