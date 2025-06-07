export function validateExtras(comment) {
    const errors = {};
    if (comment && comment.length > 200) errors.comment = "Comentario demasiado largo";
    return { valid: Object.keys(errors).length === 0, errors };
}
