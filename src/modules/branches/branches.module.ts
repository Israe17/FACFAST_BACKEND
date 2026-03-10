import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesController } from './controllers/branches.controller';
import { TerminalsController } from './controllers/terminals.controller';
import { Branch } from './entities/branch.entity';
import { Terminal } from './entities/terminal.entity';
import { BranchAccessPolicy } from './policies/branch-access.policy';
import { BranchesRepository } from './repositories/branches.repository';
import { TerminalsRepository } from './repositories/terminals.repository';
import { BranchesService } from './services/branches.service';

@Module({
  imports: [TypeOrmModule.forFeature([Branch, Terminal])],
  controllers: [BranchesController, TerminalsController],
  providers: [
    BranchesRepository,
    TerminalsRepository,
    BranchAccessPolicy,
    BranchesService,
  ],
  exports: [BranchAccessPolicy, BranchesRepository, BranchesService],
})
export class BranchesModule {}
