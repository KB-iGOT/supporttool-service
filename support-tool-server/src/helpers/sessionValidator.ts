export const isAuthenticated = (req: { session: { user: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): any; new(): any; }; }; }, next: () => void) => {
    if (!req.session.user) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    next();
};