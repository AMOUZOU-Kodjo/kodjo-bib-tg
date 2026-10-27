import { useState, useRef } from "react";
import { uploadDocument, suggestDocumentCategory } from "../api/documents";
import toast from "react-hot-toast";
import { UploadCloud, FileText, X, CheckCircle2, Globe2, Lock, Sparkles } from "lucide-react";
import { Input, Button } from "../components/ui";
import { useSiteSettings } from "../context/SiteSettingsContext";

const CATEGORIES = [
  "Éducation",
  "Littérature",
  "Science",
  "Histoire",
  "physique-chimie",
  "Art",
  "Société",
  "Petite Enfance",
  "Philosophie",
  "Géographie",
  "Politique",
  "Sport",
  "Divertissement",
  "Santé",
  "Cours",
  "TD / TP",
  "Examens / Annales",
  "Rapports / Mémoires",
  "Fiches",
  "CV & Lettres"
];

function formatFileSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  return `${(kb / 1024).toFixed(1)} Mo`;
}

export default function Upload() {
  const { maxUploadSizeMb: configuredMaxSizeMb } = useSiteSettings();
  const maxUploadSizeMb = Number(configuredMaxSizeMb) || 10;
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setSuggestedCategory(null);
    setSuggestionApplied(false);
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
    try {
      const res = await suggestDocumentCategory(selectedFile.name);
      const suggested = res.data?.suggestedCategory;
      if (suggested && !category) {
        setSuggestedCategory(suggested);
      }
    } catch (err) {
      // Ignorer silencieusement
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Fichier requis");
    if (!title.trim()) return toast.error("Titre requis");
    if (file.size > maxUploadSizeMb * 1024 * 1024) {
      return toast.error(`Fichier trop volumineux (maximum ${maxUploadSizeMb} Mo)`);
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    if (description.trim()) formData.append("description", description.trim());
    if (category) formData.append("category", category);
    formData.append("visibility", visibility);
    setLoading(true);
    try {
      const { data } = await uploadDocument(formData);
      const savedBytes = (data.compression?.originalSize || 0) - (data.compression?.finalSize || 0);
      toast.success(
        visibility === "private"
          ? "Document privé déposé avec succès"
          : savedBytes > 0
          ? `Document déposé, ${formatFileSize(savedBytes)} économisés`
          : "Document déposé avec succès"
      );
      setFile(null);
      setTitle("");
      setDescription("");
      setCategory("");
      setVisibility("public");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">Déposer un document</h1>
        <p className="text-sm text-gray-600 sm:text-base">Partagez vos documents avec la communauté. Tous les formats sont acceptés.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={submit} className="divide-y divide-gray-100">
          <div className="p-4 sm:p-6 md:p-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Fichier *</label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed p-5 text-center transition-all sm:p-8 ${
                dragActive
                  ? "border-teal-500 bg-teal-50/50"
                  : file
                  ? "border-teal-200 bg-teal-50/30"
                  : "border-gray-200 hover:border-teal-400 hover:bg-gray-50/50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 sm:h-12 sm:w-12">
                      <FileText className="w-6 h-6 text-teal-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                        {file.type && ` • ${file.type.split("/")[1]?.toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setSuggestedCategory(null);
                    setSuggestionApplied(false);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                    className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-900 font-medium mb-1">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="text-sm text-gray-500 mb-3">ou cliquez pour parcourir</p>
                  <p className="text-xs text-gray-400">Tous les formats acceptés • {maxUploadSizeMb} Mo maximum</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6 p-4 sm:p-6 md:p-8">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Titre *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Donnez un titre clair à votre document"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Catégorie</label>
                <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value) {
                    setSuggestedCategory(null);
                    setSuggestionApplied(false);
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              >
                <option value="">Sélectionner une catégorie</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "physique-chimie" ? "Physique-Chimie" : cat}
                  </option>
                ))}
              </select>
              {suggestedCategory && !category && !suggestionApplied && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Suggestion automatique : <strong>{suggestedCategory}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(suggestedCategory);
                      setSuggestionApplied(true);
                      setSuggestedCategory(null);
                    }}
                    className="ml-auto rounded-md bg-teal-700 px-2.5 py-1 text-white hover:bg-teal-800"
                  >
                    Appliquer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestedCategory(null);
                      setSuggestionApplied(false);
                    }}
                    className="rounded-md px-2.5 py-1 text-teal-700 hover:bg-teal-100"
                  >
                    Ignorer
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Visibilité</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  aria-pressed={visibility === "public"}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    visibility === "public"
                      ? "border-teal-600 bg-teal-50/60 ring-1 ring-teal-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Globe2 className={`w-5 h-5 mt-0.5 ${visibility === "public" ? "text-teal-700" : "text-gray-400"}`} />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Public</span>
                    <span className="mt-0.5 block text-xs text-gray-500">Visible par tous dans la bibliothèque et les recherches.</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  aria-pressed={visibility === "private"}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    visibility === "private"
                      ? "border-teal-600 bg-teal-50/60 ring-1 ring-teal-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Lock className={`w-5 h-5 mt-0.5 ${visibility === "private" ? "text-teal-700" : "text-gray-400"}`} />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Privé</span>
                    <span className="mt-0.5 block text-xs text-gray-500">Visible uniquement par vous et les personnes ayant le lien.</span>
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={5}
                placeholder="Ajoutez une description pour aider les autres à comprendre le contenu..."
              />
              <p className="text-xs text-gray-400 mt-1">Facultatif</p>
            </div>
          </div>

          <div className="bg-gray-50/50 p-4 sm:p-6 md:p-8">
            <Button
              type="submit"
              className="flex w-full items-center justify-center gap-2 sm:w-auto sm:px-8"
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Déposer le document
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              {visibility === "private"
                ? "Ce document restera privé. Vous pourrez générer un lien de partage depuis votre profil."
                : "En déposant ce document, vous acceptez qu'il soit partagé avec la communauté."}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
