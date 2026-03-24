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

        const url = (req as any).originalUrl || req.url || '';
        const [pathOnly, query] = url.split('?');
        const segments = pathOnly.split('/').filter(Boolean);

        let routeTenant: string | null = null;
        let shouldRewrite = false;
        let rewriteSegments: string[] | null = null;

        if (segments.length > 1 && segments[0] === 'api') {
            routeTenant = segments[1];
            shouldRewrite = true;
            rewriteSegments = ['api', ...segments.slice(2)];
        } else if (segments.length > 1 && segments[1] === 'api') {
            routeTenant = segments[0];
            shouldRewrite = true;
            rewriteSegments = ['api', ...segments.slice(2)];
        }

        const candidates = [headerTenantId, headerTenant, headerTenantDomain, routeTenant, hostname]
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
            .map((value) => value.toLowerCase());

        for (const candidate of candidates) {
            const company = await this.companyRepo.findOne({
                where: { frontendDomain: candidate, status: CompanyStatus.ACTIVE },
            });
            if (company) {
                if (shouldRewrite && rewriteSegments) {
                    const newPath = '/' + rewriteSegments.join('/');
                    (req as any).url = query ? `${newPath}?${query}` : newPath;
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
}
