import { User, UserRole, UserStatus } from "src/modules/user/entity/user.entity";
import { DataSource } from "typeorm";
import * as bcrypt from 'bcrypt';


export async function seedAdmin(ds: DataSource): Promise<void> {

    const userRepo = ds.getRepository(User);
    
    const adminEmail = process.env.ADMIN_USER_EMAIL ?? 'cmlsolutions3@gmail.com';
    const adminPhone = process.env.ADMIN_USER_PHONE ?? '3218900642';
    const adminPassword = process.env.ADMIN_USER_PASSWORD ?? 'Admin123*';

    let adminUser = await userRepo.findOne({
        where: { email: adminEmail}
    });

    if (!adminUser) {
        const hashed = await bcrypt.hash(adminPassword, 10);

        adminUser = userRepo.create({
            name: 'Administrador',
            email: adminEmail,
            phone: adminPhone,
            password: hashed,
            status: UserStatus.ACTIVE,
            role: UserRole.SUPER_ADMIN,
        });
        await userRepo.save(adminUser);
        console.log('✅ Usuario admin creado');
    } else {

        adminUser.status = UserStatus.ACTIVE;
        await userRepo.save(adminUser);
        console.log('↻ Usuario admin actualizado (rol/estado)');
    }
}
