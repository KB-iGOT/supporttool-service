import express, { Request, Response, NextFunction, Express } from 'express';
import fs from 'fs';
import compression from 'compression';
import path from 'path';

const oneDayMS = 86400000;
const pathMap: Record<string, 'exist' | 'notExist' | undefined> = {};

// Set zip config middleware
const setZipConfig = (
  req: Request,
  res: Response,
  type: string,
  encoding: string,
  dist: string = '../../../support-tool-react-client/build/'
): boolean => {
  const key = req.path + type;

  if (pathMap[key] === 'notExist') {
    return false;
  }

  const fullPath = path.join(__dirname, dist, req.path + '.' + type);

  if (pathMap[key] === 'exist' || fs.existsSync(fullPath)) {
    if (req.path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    } else if (req.path.endsWith('.js')) {
      res.set('Content-Type', 'text/javascript');
    }

    req.url = req.url + '.' + type;
    res.set('Content-Encoding', encoding);
    pathMap[key] = 'exist';
    return true;
  } else {
    pathMap[key] = 'notExist';
    return false;
  }
};

// Main export middleware function
export default (app: Express, isAuthenticated: (req: Request, res: Response, next: NextFunction) => void): void => {
  // JS and CSS file handling
  app.get(['*.js', '*.css'], (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', `public, max-age=${oneDayMS * 30}`);
    res.setHeader('Expires', new Date(Date.now() + oneDayMS * 30).toUTCString());

    const encoding = req.get('Accept-Encoding');

    if (encoding?.includes('br')) {
      if (!setZipConfig(req, res, 'br', 'br') && encoding.includes('gzip')) {
        setZipConfig(req, res, 'gz', 'gzip');
      }
    } else if (encoding?.includes('gzip')) {
      setZipConfig(req, res, 'gz', 'gzip');
    }

    next();
  });

  // Font and image file compression & caching
  app.get(
    [
      '/dist/*.ttf',
      '/dist/*.woff2',
      '/dist/*.woff',
      '/dist/*.eot',
      '/dist/*.svg',
      '/*.ttf',
      '/*.woff2',
      '/*.woff',
      '/*.eot',
      '/*.svg',
      '/*.html',
    ],
    compression(),
    (_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Cache-Control', `public, max-age=${oneDayMS * 30}`);
      res.setHeader('Expires', new Date(Date.now() + oneDayMS * 30).toUTCString());
      next();
    }
  );

  // Serve static files
  const buildPath = path.join(__dirname, '../../../support-tool-react-client/build/');
  app.use(express.static(buildPath, { extensions: ['ejs'], index: false }));
  app.use('/dist', express.static(buildPath, { extensions: ['ejs'], index: false }));

  // Image caching
  app.get('/assets/images/*', (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', `public, max-age=${oneDayMS}`);
    res.setHeader('Expires', new Date(Date.now() + oneDayMS).toUTCString());
    next();
  });

  // Specific login route
  app.all(['/login'], (req: Request, res: Response) => {
    renderDefaultIndexPage(req, res);
  });

  // Catch-all route for client-side routing - serve React app for all non-API routes
  app.get('*', (req: Request, res: Response) => {
    // Skip API routes - they should have been handled already
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    renderDefaultIndexPage(req, res);
  });
};

// Render index page
const renderDefaultIndexPage = (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../../../support-tool-react-client/build/', 'index.html'));
};