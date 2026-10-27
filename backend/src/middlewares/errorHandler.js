export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.message === "Type de fichier non autorisé") {
    return res.status(400).json({ error: { code: "INVALID_FILE_TYPE", message: err.message } });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: {
        code: "FILE_TOO_LARGE",
        message: err.message || "Fichier trop volumineux",
        maxUploadSizeMb: err.maxUploadSizeMb
      }
    });
  }
  res.status(err.status || 500).json({ error: { code: err.code || "SERVER_ERROR", message: err.message || "Erreur serveur" } });
}
