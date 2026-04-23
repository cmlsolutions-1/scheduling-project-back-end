import { ResponseCompanyDto } from "./dto/response-company.dto";
import { ResponseCompanyAdminDto } from "./dto/response-company-admin.dto";
import { ResponseCompanyWithAdminDto } from "./dto/response-company-with-admin.dto";
import { Company } from "./entity/company.entity";
import { User, UserRole, UserStatus } from "../user/entity/user.entity";

export class CompanyMapper {
    static toResponse(company: Company): ResponseCompanyDto {
        return {
            id: company.id,
            name: company.name,
            description: company.description,
            frontendDomain: company.frontendDomain,
            status: company.status,
        };
    }

    static toResponseList(companies: Company[]): ResponseCompanyDto[] {
        return companies.map((company) => this.toResponse(company));
    }

    static toResponseWithAdmin(company: Company): ResponseCompanyWithAdminDto {
        const admin = (company.users ?? []).find((user) =>
            user.role === UserRole.ADMIN && user.status === UserStatus.ACTIVE);
        const response: ResponseCompanyWithAdminDto = {
            id: company.id,
            name: company.name,
            description: company.description,
            frontendDomain: company.frontendDomain,
            status: company.status,
            hasAdmin: !!admin,
            admin: admin ? this.toAdminResponse(admin) : null,
        };

        return response;
    }

    static toResponseWithAdminList(companies: Company[]): ResponseCompanyWithAdminDto[] {
        return companies.map((company) => this.toResponseWithAdmin(company));
    }

    static toAdminResponse(admin: User): ResponseCompanyAdminDto {
        return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone ?? null,
            role: admin.role,
            status: admin.status,
        };
    }
}
