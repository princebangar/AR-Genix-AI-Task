
class RequestValidator {

    static validateField(value, schema, fieldName) {
        const errors = [];

        if (schema.required && (value === undefined || value === null || value === '')) {
            errors.push(`${fieldName} is required`);
            return errors;
        }

        if (!schema.required && (value === undefined || value === null)) {
            return errors;
        }

        if (schema.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;

            if (schema.type === 'number' && actualType !== 'number') {
                errors.push(`${fieldName} must be a number`);
            } else if (schema.type === 'string' && actualType !== 'string') {
                errors.push(`${fieldName} must be a string`);
            } else if (schema.type === 'boolean' && actualType !== 'boolean') {
                errors.push(`${fieldName} must be a boolean`);
            } else if (schema.type === 'array' && actualType !== 'array') {
                errors.push(`${fieldName} must be an array`);
            } else if (schema.type === 'object' && (actualType !== 'object' || Array.isArray(value))) {
                errors.push(`${fieldName} must be an object`);
            }
        }

        if (errors.length > 0) {
            return errors;
        }

        if (schema.type === 'string') {
            if (typeof value === 'string' && this.containsSuspiciousPatterns(value)) {
                errors.push(`${fieldName} contains invalid characters`);
            }

            if (schema.minLength && value.length < schema.minLength) {
                errors.push(`${fieldName} must be at least ${schema.minLength} characters`);
            }
            if (schema.maxLength && value.length > schema.maxLength) {
                errors.push(`${fieldName} must be at most ${schema.maxLength} characters`);
            }
            if (schema.pattern && !schema.pattern.test(value)) {
                errors.push(`${fieldName} format is invalid`);
            }
            if (schema.enum && !schema.enum.includes(value)) {
                errors.push(`${fieldName} must be one of: ${schema.enum.join(', ')}`);
            }
        }

        if (schema.type === 'number') {
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`${fieldName} must be at least ${schema.min}`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`${fieldName} must be at most ${schema.max}`);
            }
            if (schema.integer && !Number.isInteger(value)) {
                errors.push(`${fieldName} must be an integer`);
            }
        }

        if (schema.type === 'array') {
            if (schema.minLength && value.length < schema.minLength) {
                errors.push(`${fieldName} must contain at least ${schema.minLength} items`);
            }
            if (schema.maxLength && value.length > schema.maxLength) {
                errors.push(`${fieldName} must contain at most ${schema.maxLength} items`);
            }
        }

        if (schema.custom && typeof schema.custom === 'function') {
            const customError = schema.custom(value);
            if (customError) {
                errors.push(customError);
            }
        }

        return errors;
    }

    static containsSuspiciousPatterns(str) {
        const suspiciousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /('|(--)|;|\*|\/\*|\*\/)/g
        ];

        return suspiciousPatterns.some(pattern => pattern.test(str));
    }

    static validateObject(obj, schema, prefix = '') {
        const errors = [];

        for (const [fieldName, fieldSchema] of Object.entries(schema.fields || {})) {
            const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
            const value = obj[fieldName];

            const fieldErrors = this.validateField(value, fieldSchema, fullFieldName);
            errors.push(...fieldErrors);

            // Validate nested objects
            if (fieldSchema.type === 'object' && fieldSchema.fields && value) {
                const nestedErrors = this.validateObject(value, fieldSchema, fullFieldName);
                errors.push(...nestedErrors);
            }
        }

        return errors;
    }

    static validate(schema, source = 'body') {
        return (req, res, next) => {
            const data = req[source];

            if (!data || typeof data !== 'object') {
                return res.status(400).json({
                    error: 'Invalid request data',
                    details: ['Request payload is missing or invalid']
                });
            }

            if (schema.strict) {
                const allowedFields = Object.keys(schema.fields || {});
                const providedFields = Object.keys(data);
                const unexpectedFields = providedFields.filter(f => !allowedFields.includes(f));

                if (unexpectedFields.length > 0) {
                    return res.status(400).json({
                        error: 'Validation failed',
                        details: [`Unexpected fields: ${unexpectedFields.join(', ')}`]
                    });
                }
            }

            const errors = this.validateObject(data, schema);

            if (errors.length > 0) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors
                });
            }

            next();
        };
    }
}

module.exports = RequestValidator;
