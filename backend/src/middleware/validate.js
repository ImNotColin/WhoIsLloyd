/** Returns middleware that validates req.body against a zod schema. */
export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      );
      return res.status(400).json({ error: 'Validation failed', issues });
    }
    req.body = result.data;
    next();
  };
}
