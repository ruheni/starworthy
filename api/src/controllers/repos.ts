import { FastifyRequest } from 'fastify';
import { fetchRepos, fetchRandomRepo } from '../services/repos';
import { errorLogger, userActionLogger } from '../decorators/logger';

export const getRepos = async (
  req: FastifyRequest,
): Promise<Repo[] | undefined> => {
  const { language, stars, contributors, issues, prs } = req.query as {
    language?: string;
    stars?: number;
    contributors?: number;
    issues?: number;
    prs?: number;
  };

  try {
    userActionLogger.log('user requested getUser');
    const repos = await fetchRepos(language, stars, contributors, issues, prs);

    return repos;
  } catch (e) {
    errorLogger.log(`Error in starsController: ${e.message}`);
    throw Error(e.message);
  }
};

export const getRandom = async (): Promise<Repo> => {
  try {
    userActionLogger.log('user requested getRandom');
    const repos = await fetchRandomRepo();

    return repos;
  } catch (e) {
    errorLogger.log(`Error in starsController: ${e.message}`);
    throw Error(e.message);
  }
};
