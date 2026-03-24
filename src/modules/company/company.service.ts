import { Injectable } from '@nestjs/common';
import { CompanyRepository } from './repositories/company.repository';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
    constructor(private readonly repository: CompanyRepository) {}

    create(dto: CreateCompanyDto, authorId: string) {
        return this.repository.createCompany(dto, authorId);
    }

    findAll() {
        return this.repository.findAll();
    }

    findOne(id: string) {
        return this.repository.findById(id);
    }

    update(id: string, dto: UpdateCompanyDto, authorId: string) {
        return this.repository.updateCompany(id, dto, authorId);
    }

    remove(id: string, authorId: string) {
        return this.repository.deleteCompany(id, authorId);
    }

    active(id: string, authorId: string) {
        return this.repository.activateCompany(id, authorId);
    }
}
