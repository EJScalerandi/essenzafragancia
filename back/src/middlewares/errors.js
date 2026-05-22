function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NotFound',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Zod validation
  if (err && err.name === 'ZodError') {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid request body',
      issues: err.issues,
    });
  }

  const status = Number(err.status || 500);
  const code = err.code || 'InternalError';
  const message = err.message || 'Unexpected error';

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  return res.status(status).json({ error: code, message });
}

module.exports = { notFoundHandler, errorHandler };
