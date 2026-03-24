import { ResponseCompanyDto } from "./dto/response-company.dto";
import { Company } from "./entity/company.entity";

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
}
