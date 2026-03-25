import { Injectable, NestMiddleware } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NextFunction, Request, Response } from "express";
import { Repository } from "typeorm";
import { Company, CompanyStatus } from "src/modules/company/entity/company.entity";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
    ) { }

    async use(req: Request & { tenant?: Company; tenantId?: string }, res: Response, next: NextFunction) {
        const tenant = await this.resolveTenant(req);
        if (tenant) {
            req.tenant = tenant;
            req.tenantId = tenant.id;
        }
        next();
    }

    private async resolveTenant(req: Request): Promise<Company | null> {
        const headerTenantId = this.getHeaderValue(req, 'x-tenant-id');
        if (headerTenantId) {
            const byId = await this.companyRepo.findOne({
                where: { id: headerTenantId, status: CompanyStatus.ACTIVE },
            });
            if (byId) return byId;
        }

        const headerTenant = this.getHeaderValue(req, 'x-tenant');
        const headerTenantDomain = this.getHeaderValue(req, 'x-tenant-domain');

        const hostHeader = (req.headers['x-forwarded-host'] || req.headers.host || '') as string | string[];
        const hostValue = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
        const hostname = hostValue?.split(':')[0]?.toLowerCase();

        const originalUrl = (req as any).originalUrl || req.url || '';
        const routeInfo = this.extractRouteTenantInfo(originalUrl);
        const routeTenant = routeInfo?.tenant ?? null;

        const candidates = [headerTenantId, headerTenant, headerTenantDomain, routeTenant, hostname]
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
            .map((value) => value.toLowerCase());

        for (const candidate of candidates) {
            const company = await this.companyRepo.findOne({
                where: { frontendDomain: candidate, status: CompanyStatus.ACTIVE },
            });
            if (company) {
                if (routeInfo?.shouldRewrite) {
                    this.rewriteRequestUrl(req, routeInfo.tenant);
                }
                return company;
            }
        }

        return null;
    }

    private getHeaderValue(req: Request, key: string): string | null {
        const raw = req.headers[key] as string | string[] | undefined;
        if (!raw) return null;
        return Array.isArray(raw) ? raw[0] : raw;
    }

    private extractRouteTenantInfo(url: string): { tenant: string; shouldRewrite: boolean } | null {
        const [pathOnly] = url.split('?');
        const segments = pathOnly.split('/').filter(Boolean);

        if (segments.length > 2 && segments[0] === 'api') {
            return { tenant: segments[1], shouldRewrite: true };
        }

        if (segments.length > 2 && segments[1] === 'api') {
            return { tenant: segments[0], shouldRewrite: true };
        }

        return null;
    }

    private rewriteRequestUrl(req: Request, tenant: string) {
        const currentUrl = req.url || '';
        const [pathOnly, query] = currentUrl.split('?');
        const segments = pathOnly.split('/').filter(Boolean);

        let rewrittenSegments = segments;

        if (segments.length > 1 && segments[0] === 'api' && segments[1] === tenant) {
            rewrittenSegments = ['api', ...segments.slice(2)];
        } else if (segments.length > 0 && segments[0] === tenant) {
            rewrittenSegments = segments.slice(1);
        } else if (segments.length > 2 && segments[0] === tenant && segments[1] === 'api') {
            rewrittenSegments = ['api', ...segments.slice(2)];
        }

        const newPath = '/' + rewrittenSegments.join('/');
        (req as any).url = query ? `${newPath}?${query}` : newPath;
    }
}
