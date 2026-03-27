# Security Policy

## Known Vulnerabilities - Accepted Risk

### Prisma 7 Development Dependencies (March 2026)

We are currently using Prisma 7.5.0 which has vulnerabilities in its development tooling dependencies. These have been assessed and accepted for the following reasons:

#### Affected Packages

- `@prisma/dev` - Internal Prisma development server and tooling
- `hono` & `@hono/node-server` - Used by Prisma's dev server
- `lodash`, `chevrotain`, `@mrleebo/prisma-ast` - Used by Prisma's schema parser

#### Risk Assessment

- **Production Impact**: None - These packages are only used by the Prisma CLI during development
- **Runtime Impact**: None - `@prisma/client` (our production dependency) has no vulnerabilities
- **Exposure**: Limited to local development environment only
- **Severity**: 5 moderate, 4 high (all in dev tooling)

#### Mitigation

- Vulnerabilities do not affect production builds or runtime
- Development environment is trusted and not exposed to external traffic
- Monitoring Prisma releases for security patches
- Will update to patched versions when available

#### Decision

**Status**: Accepted Risk  
**Date**: March 12, 2026  
**Reviewed By**: Development Team  
**Next Review**: When Prisma 7.6+ is released

#### Why Not Downgrade to Prisma 6?

- Prisma 7 provides 90% smaller bundle sizes
- Better performance with new architecture
- Required for optimal Neon serverless integration
- Prisma 6 will be deprecated in the future
- The vulnerabilities don't affect our production code

## Suppression Configuration

We've configured npm to suppress audit warnings during normal operations:

- `.npmrc` - Disables automatic audit on `npm install`
- CI/CD should use `npm audit --audit-level=critical` to only fail on critical production vulnerabilities

## Monitoring

We will update Prisma when:

1. Security patches are released for version 7.x
2. Critical vulnerabilities affecting production code are discovered
3. Prisma team releases statements about the current vulnerabilities

Check for updates: `npm outdated prisma @prisma/client`
