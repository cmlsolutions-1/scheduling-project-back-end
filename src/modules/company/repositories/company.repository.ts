import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Company, CompanyStatus } from "../entity/company.entity";
import { CompanyMapper } from "../company.mapper";
import { ResponseCompanyAdminDto } from "../dto/response-company-admin.dto";
import { ResponseCompanyDto } from "../dto/response-company.dto";
import { ResponseCompanyWithAdminDto } from "../dto/response-company-with-admin.dto";
import { UserRole, UserStatus } from "src/modules/user/entity/user.entity";

@Injectable()
export class CompanyRepository {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
    ) {}

    async createCompany(data: Partial<Company>, authorId: string): Promise<ResponseCompanyDto> {
        const company = this.companyRepo.create({
            ...data,
            status: CompanyStatus.ACTIVE,
            createdBy: authorId,
            updatedBy: authorId,
        });

        const saved = await this.companyRepo.save(company);
        const full = await this.companyRepo.findOne({ where: { id: saved.id } });
        return CompanyMapper.toResponse(full ?? saved);
    }

    async findAll(): Promise<ResponseCompanyDto[]> {
        const companies = await this.companyRepo.find({ where: { status: CompanyStatus.ACTIVE } });
        return CompanyMapper.toResponseList(companies);
    }

    async findAllWithAdmin(): Promise<ResponseCompanyWithAdminDto[]> {
        const companies = await this.companyRepo.createQueryBuilder('company')
            .leftJoinAndSelect(
                'company.users',
                'admin',
                'admin.role = :adminRole AND admin.status = :adminStatus',
                { adminRole: UserRole.ADMIN, adminStatus: UserStatus.ACTIVE },
            )
            .where('company.status = :companyStatus', { companyStatus: CompanyStatus.ACTIVE })
            .orderBy('company.name', 'ASC')
            .getMany();

        return CompanyMapper.toResponseWithAdminList(companies);
    }

    async findAdminByCompanyId(id: string): Promise<ResponseCompanyAdminDto | null> {
        const company = await this.companyRepo.createQueryBuilder('company')
            .leftJoinAndSelect(
                'company.users',
                'admin',
                'admin.role = :adminRole AND admin.status = :adminStatus',
                { adminRole: UserRole.ADMIN, adminStatus: UserStatus.ACTIVE },
            )
            .where('company.id = :id', { id })
            .andWhere('company.status = :companyStatus', { companyStatus: CompanyStatus.ACTIVE })
            .getOne();

        if (!company) {
            throw new NotFoundException('Empresa no encontrada');
        }

        const admin = (company.users ?? []).find((user) =>
            user.role === UserRole.ADMIN && user.status === UserStatus.ACTIVE);

        return admin ? CompanyMapper.toAdminResponse(admin) : null;
    }

    async findById(id: string): Promise<ResponseCompanyDto> {
        const company = await this.companyRepo.findOne({ where: { id, status: CompanyStatus.ACTIVE } });
        if (!company) throw new NotFoundException('Empresa no encontrada');
        return CompanyMapper.toResponse(company);
    }

    async updateCompany(id: string, data: Partial<Company>, authorId: string): Promise<ResponseCompanyDto> {
        const company = await this.companyRepo.findOne({ where: { id, status: CompanyStatus.ACTIVE } });
        if (!company) throw new BadRequestException('Empresa no encontrada');
        Object.assign(company, data);
        company.updatedBy = authorId;
        const saved = await this.companyRepo.save(company);
        const full = await this.companyRepo.findOne({ where: { id: saved.id } });
        return CompanyMapper.toResponse(full ?? saved);
    }

    async deleteCompany(id: string, authorId: string): Promise<void> {
        const company = await this.companyRepo.findOne({ where: { id, status: CompanyStatus.ACTIVE } });
        if (!company) throw new NotFoundException('Empresa no encontrada');
        company.status = CompanyStatus.INACTIVE;
        company.updatedBy = authorId;
        await this.companyRepo.save(company);
    }

    async activateCompany(id: string, authorId: string): Promise<void> {
        const company = await this.companyRepo.findOne({ where: { id, status: CompanyStatus.INACTIVE } });
        if (!company) throw new NotFoundException('Empresa no encontrada');
        company.status = CompanyStatus.ACTIVE;
        company.updatedBy = authorId;
        await this.companyRepo.save(company);
    }
}
