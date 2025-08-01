export const isValidCommentLength = (input: string, maxLength: number): boolean => {
    const trimmed = input.trim();
    return trimmed.length > 0 && trimmed.length <= maxLength;
};

export const containsPII = (text: string): boolean => {
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /\d{3}[-.]?\d{3}[-.]?\d{4}/;
    return emailRegex.test(text) || phoneRegex.test(text);
};