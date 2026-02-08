
class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60000;
        this.maxRequests = options.maxRequests || 100;
        this.message = options.message || 'Too many requests, please try again later';

        this.clients = new Map();

        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, data] of this.clients.entries()) {
            if (now > data.resetTime) {
                this.clients.delete(ip);
            }
        }
    }

    getClientIP(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }

        return req.ip || req.connection.remoteAddress || 'unknown';
    }

    middleware() {
        return (req, res, next) => {
            const ip = this.getClientIP(req);
            const now = Date.now();

            let clientData = this.clients.get(ip);

            if (!clientData || now > clientData.resetTime) {
                clientData = {
                    count: 1,
                    resetTime: now + this.windowMs
                };
                this.clients.set(ip, clientData);

                res.setHeader('X-RateLimit-Limit', this.maxRequests);
                res.setHeader('X-RateLimit-Remaining', this.maxRequests - 1);
                res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());

                return next();
            }

            if (clientData.count >= this.maxRequests) {
                res.setHeader('X-RateLimit-Limit', this.maxRequests);
                res.setHeader('X-RateLimit-Remaining', 0);
                res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
                res.setHeader('Retry-After', Math.ceil((clientData.resetTime - now) / 1000));

                return res.status(429).json({
                    error: this.message,
                    retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
                });
            }

            clientData.count++;
            this.clients.set(ip, clientData);

            res.setHeader('X-RateLimit-Limit', this.maxRequests);
            res.setHeader('X-RateLimit-Remaining', this.maxRequests - clientData.count);
            res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());

            next();
        };
    }


    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clients.clear();
    }
}

module.exports = RateLimiter;
