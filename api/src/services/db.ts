import { PrismaClient } from '@prisma/client';
import { errorLogger, performanceLogger } from '../decorators/logger';
import FilterManager from '../filters/FilterManager';
import FilterStrategy from '../filters/FilterStrategy';
import LanguageFilter from '../filters/filters/LanguageFilter';
import StarCountFilter from '../filters/filters/StarCountFilter';
import ContributorsFilter from '../filters/filters/ContributorsFilter';
import IssuesFilter from '../filters/filters/IssuesFilter';
import PullRequestsFilter from '../filters/filters/PullRequestFilter';

const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

export const findUser = async (username: string) => {
  try {
    performanceLogger.startNow();
    const user = await db.user.findUnique({
      where: { github_username: username },
    });

    performanceLogger.log();

    return user;
  } catch (e) {
    errorLogger.log(`Error in db service: ${e.message}`);
    return undefined;
  }
};

export const readRepos = async (
  userId: number,
  language?: string,
  stars?: number,
  contributors?: number,
  issues?: number,
  prs?: number,
) => {
  try {
    performanceLogger.startNow();

    const repos = await db.repo.findMany({
      where: { userId },
    });

    const filters: FilterStrategy[] = [];

    if (language) {
      filters.push(new LanguageFilter(language));
    }

    if (stars) {
      filters.push(new StarCountFilter(stars));
    }

    if (contributors) {
      filters.push(new ContributorsFilter(contributors));
    }

    if (issues) {
      filters.push(new IssuesFilter(issues));
    }

    if (prs) {
      filters.push(new PullRequestsFilter(prs));
    }

    const filterManager = new FilterManager(filters);
    const filteredRepos = filterManager.applyFilters(repos);

    performanceLogger.log();

    return filteredRepos;
  } catch (e) {
    errorLogger.log(`Error in db service: ${e.message}`);
    return undefined;
  }
};

export const readReposByLanguage = async (userId: number, language: string) => {
  try {
    performanceLogger.startNow();

    const repos = await db.repo.findMany({
      where: { userId, language },
    });

    performanceLogger.log();

    return repos;
  } catch (e) {
    errorLogger.log(`Error in db service: ${e.message}`);
    return undefined;
  }
};

export const writeUser = async (username: string) => {
  try {
    performanceLogger.startNow();

    const userToCreate = await db.user.create({
      data: { github_username: username },
    });

    performanceLogger.log();

    return userToCreate;
  } catch (e) {
    errorLogger.log(`Error in db service: ${e.message}`);
    return undefined;
  }
};

export const writeRepos = async (repos: Repo[], id: number) => {
  try {
    performanceLogger.startNow();

    const reposToWrite = await db.repo.createMany({
      data: repos.map((repo) => ({
        repo_id: repo.repoId,
        name: repo.name,
        description: repo.description !== null ? repo.description : '',
        stars: repo.stars,
        language: repo.language !== null ? repo.language : '',
        issues: repo.issues,
        url: repo.url,
        created_at: repo.createdAt !== null ? repo.createdAt : '',
        userId: id,
        owner: repo.owner,
      })),
      skipDuplicates: true,
    });

    performanceLogger.log();

    return reposToWrite;
  } catch (e) {
    errorLogger.log(`Error in db service: ${e.message}`);
    return undefined;
  }
};

export const deleteRepo = async (
  owner: string,
  repo: string,
): Promise<void> => {
  try {
    performanceLogger.startNow();

    await db.repo.deleteMany({
      where: {
        owner,
        name: repo,
      },
    });

    performanceLogger.log();
  } catch (e) {
    errorLogger.log(`Error in db service: ${e.message}`);
    throw Error(e.message);
  }
};

export const deleteRepos = async (repoIds: Repo[]): Promise<void> => {
  try {
    performanceLogger.startNow();

    await db.repo.deleteMany({
      where: {
        repo_id: { in: repoIds },
      },
    });

    performanceLogger.log();
  } catch (e) {
    errorLogger.log(`Error in db service: ${e.message}`);
    throw Error(e.message);
  }
};

export const findRandom = async (): Promise<Repo> => {
  try {
    performanceLogger.startNow();

    const count = await db.repo.count();
    const randomIndex = Math.floor(Math.random() * count);

    const randomRepo = await db.repo.findFirst({
      skip: randomIndex, // skip to the randomly generated index and retrieve the corresponding repo
    });

    performanceLogger.log();

    return randomRepo;
  } catch (e) {
    errorLogger.log(`Error in db service: ${e.message}`);
    throw Error(e.message);
  }
};
