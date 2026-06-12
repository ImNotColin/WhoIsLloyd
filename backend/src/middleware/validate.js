// validate.js — zod gate for request bodies. Bad input gets a 400 with a
// readable list of complaints; good input gets parsed, trimmed, and coerced
// before any handler has to look at it.

/** Returns middleware that validates req.body against a zod schema. */
export default function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      // Flatten zod's issue tree into "field.path: message" strings the
      // frontend can show verbatim instead of guessing.
      const issues = parsed.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      );
      return res.status(400).json({ error: 'Validation failed', issues });
    }
    // Replace the body with zod's output, not the raw input — downstream
    // code gets the post-trim, post-coercion data and nothing extra.
    req.body = parsed.data;
    next();
  };
}
