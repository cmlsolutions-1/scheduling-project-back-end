import type { Company } from "src/modules/company/entity/company.entity";

declare global {
    namespace Express {
        interface Request {
            tenant?: Company;
            tenantId?: string;
        }
    }
}

export {};
