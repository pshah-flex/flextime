# FlexTime Maintenance Guide

## Overview

This guide covers regular maintenance procedures, monitoring, and operational tasks for the FlexTime application.

---

## Regular Maintenance Tasks

### Daily

1. **Monitor Daily Sync** (Automated)
   - Check Vercel logs after 1 PM UTC (5 AM PST)
   - Verify daily sync completes successfully
   - Review sync statistics (agents, groups, time entries, sessions)

2. **Check Error Logs**
   - Review Vercel function logs for errors
   - Check Supabase logs for database issues
   - Monitor email sending status

### Weekly

1. **Monitor Weekly Email Digest** (Automated)
   - Check Vercel logs Monday after 2 PM UTC (6 AM PST)
   - Verify emails sent successfully
   - Review email delivery reports in Resend dashboard

2. **Review Data Quality**
   - Check for incomplete sessions
   - Verify data consistency
   - Review duplicate detection logs

### Monthly

1. **Database Maintenance**
   - Review database size and growth
   - Check for unused indexes
   - Analyze query performance

2. **API Usage Review**
   - Check Jibble API usage
   - Review Resend email usage
   - Monitor Airtable API calls

3. **Performance Review**
   - Review slow queries
   - Check function execution times
   - Optimize as needed

---

## Monitoring

### Key Metrics to Monitor

1. **Data Ingestion**
   - Number of time entries ingested per day
   - Number of sessions derived
   - Ingestion success/failure rate
   - Average ingestion duration

2. **Email Delivery**
   - Number of emails sent per week
   - Email delivery success rate
   - Email bounce/complaint rates
   - Delivery times

3. **System Health**
   - Function execution times
   - Database query performance
   - API response times
   - Error rates

4. **Data Quality**
   - Number of incomplete sessions
   - Number of duplicate entries detected
   - Data consistency checks

### Monitoring Tools

1. **Vercel Dashboard**
   - Function logs
   - Cron job execution history
   - Function execution metrics
   - Error tracking

2. **Supabase Dashboard**
   - Database logs
   - Query performance
   - Database size and usage
   - Connection metrics

3. **Resend Dashboard**
   - Email delivery reports
   - API usage statistics
   - Domain verification status

---

## Database Maintenance

### Regular Tasks

1. **Index Optimization**
   ```sql
   -- Check index usage
   SELECT 
     schemaname,
     tablename,
     indexname,
     idx_scan,
     idx_tup_read,
     idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan ASC;
   
   -- Remove unused indexes if needed
   DROP INDEX IF EXISTS unused_index_name;
   ```

2. **Vacuum and Analyze**
   ```sql
   -- Run VACUUM ANALYZE regularly (Supabase handles this automatically)
   -- Monitor bloat
   SELECT 
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

3. **Check for Orphaned Records**
   ```sql
   -- Activities without agents
   SELECT COUNT(*) FROM activities a
   LEFT JOIN agents ag ON a.agent_id = ag.id
   WHERE ag.id IS NULL;
   
   -- Activities without client groups
   SELECT COUNT(*) FROM activities a
   LEFT JOIN client_groups cg ON a.client_group_id = cg.id
   WHERE cg.id IS NULL;
   
   -- Clean up if needed
   DELETE FROM activities WHERE agent_id NOT IN (SELECT id FROM agents);
   ```

### Backup Procedures

1. **Supabase Automated Backups**
   - Supabase Pro plan includes daily backups
   - Backups retained for 7 days (Pro) or 30 days (Team)
   - Verify backup status in Supabase dashboard

2. **Manual Backup** (if needed)
   ```bash
   # Export specific table
   pg_dump -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -t activities \
     > activities_backup.sql
   ```

---

## Data Archiving

### When to Archive

- When database size becomes large
- When query performance degrades
- When storage costs increase significantly

### Archive Strategy

1. **Keep Recent Data Active**
   - Keep last 12 months active
   - Archive older data to separate tables or storage

2. **Archive Process** (Future Implementation)
   ```sql
   -- Example: Archive activities older than 1 year
   CREATE TABLE activities_archive AS 
   SELECT * FROM activities 
   WHERE time_utc < NOW() - INTERVAL '1 year';
   
   -- Move to archive
   INSERT INTO activities_archive 
   SELECT * FROM activities 
   WHERE time_utc < NOW() - INTERVAL '1 year';
   
   -- Delete from main table
   DELETE FROM activities 
   WHERE time_utc < NOW() - INTERVAL '1 year';
   ```

---

## Updating Environment Variables

### When to Update

- When API keys expire
- When switching to new services
- When adding new integrations

### Update Process

1. **In Vercel Dashboard**:
   - Go to Project → Settings → Environment Variables
   - Add or update variable
   - Select environments (Production, Preview, Development)
   - Save

2. **Redeploy**:
   - After updating environment variables, trigger a redeploy
   - Vercel → Deployments → Redeploy

3. **Verify**:
   - Test affected endpoints
   - Check logs for errors
   - Verify functionality works

---

## Updating Dependencies

### Regular Updates

1. **Check for Updates**:
   ```bash
   npm outdated
   ```

2. **Update Dependencies**:
   ```bash
   # Update patch versions
   npm update
   
   # Update to latest versions (test first)
   npm install package-name@latest
   ```

3. **Test After Updates**:
   ```bash
   npm run build
   npm run lint
   npm run dev  # Test locally
   ```

4. **Commit and Deploy**:
   ```bash
   git add package.json package-lock.json
   git commit -m "Update dependencies"
   git push
   ```

### Security Updates

- Monitor npm audit warnings
- Update security patches immediately
- Review breaking changes before major updates

---

## Troubleshooting Procedures

### Common Issues

1. **Daily Sync Fails**
   - Check Vercel logs for errors
   - Verify Jibble API credentials
   - Check database connectivity
   - Test manual sync endpoint

2. **Email Delivery Fails**
   - Verify Resend API key
   - Check domain verification
   - Review email addresses in Airtable
   - Check Resend dashboard for errors

3. **Database Performance Issues**
   - Review slow queries
   - Check indexes
   - Analyze table sizes
   - Consider archiving old data

### Escalation Process

1. **Level 1**: Check logs and documentation
2. **Level 2**: Review troubleshooting guide
3. **Level 3**: Contact development team
4. **Level 4**: Engage vendor support (Vercel, Supabase, Resend)

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Supabase automated daily backups
   - Point-in-time recovery available (Pro plan)

2. **Code Backups**
   - Git repository serves as code backup
   - All code changes tracked in version control

3. **Configuration Backups**
   - Environment variables documented in `DEPLOYMENT.md`
   - Keep secure backup of credentials

### Recovery Procedures

1. **Database Recovery**
   - Use Supabase dashboard for point-in-time recovery
   - Restore from backup if needed
   - Verify data integrity after recovery

2. **Application Recovery**
   - Redeploy from Git repository
   - Restore environment variables
   - Verify all endpoints work

3. **Data Recovery**
   - Re-run ingestion for affected date ranges
   - Use backfill scripts to recover data
   - Verify data completeness

---

## Performance Optimization

### Regular Optimization Tasks

1. **Database Query Optimization**
   - Review slow queries monthly
   - Add indexes for frequently queried columns
   - Optimize complex queries

2. **Function Optimization**
   - Review function execution times
   - Optimize heavy operations
   - Reduce external API calls where possible

3. **Caching Strategy** (Future)
   - Implement caching for frequently accessed data
   - Cache aggregation results
   - Use CDN for static assets

---

## Security Maintenance

### Regular Security Tasks

1. **Review Access Logs**
   - Check Vercel function logs for suspicious activity
   - Review API usage patterns
   - Monitor for unusual requests

2. **Update Credentials**
   - Rotate API keys periodically
   - Update passwords if exposed
   - Review access permissions

3. **Dependency Security**
   - Run `npm audit` regularly
   - Update vulnerable packages
   - Review security advisories

4. **Environment Variables**
   - Never commit secrets to Git
   - Use Vercel environment variables
   - Rotate secrets periodically

---

## Change Management

### Deployment Process

1. **Development**
   - Work in feature branches
   - Test locally before committing
   - Code review process

2. **Testing**
   - Test in development environment
   - Verify all endpoints work
   - Check for breaking changes

3. **Deployment**
   - Merge to main branch
   - Vercel auto-deploys
   - Monitor deployment logs

4. **Verification**
   - Test production endpoints
   - Verify cron jobs execute
   - Check error logs

### Rollback Procedures

1. **Code Rollback**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push
   
   # Or revert to specific commit
   git revert <commit-hash>
   git push
   ```

2. **Database Rollback**
   - Use Supabase point-in-time recovery
   - Or restore from backup
   - Verify data integrity

---

## Documentation Updates

### Keep Documentation Current

1. **Update When**:
   - New features are added
   - API changes are made
   - Procedures change
   - Issues are discovered and resolved

2. **Documents to Update**:
   - `API_DOCUMENTATION.md`
   - `UI_USER_GUIDE.md`
   - `TROUBLESHOOTING.md`
   - `DEPLOYMENT.md`
   - `README.md`

---

## Support and Contact

For maintenance questions or issues:

1. Review relevant documentation
2. Check troubleshooting guide
3. Review logs and error messages
4. Contact development team if needed

---

## Maintenance Checklist

### Daily
- [ ] Monitor daily sync completion
- [ ] Check error logs

### Weekly
- [ ] Monitor weekly email digest
- [ ] Review data quality

### Monthly
- [ ] Review database performance
- [ ] Check API usage
- [ ] Optimize queries
- [ ] Update dependencies (if needed)

### Quarterly
- [ ] Review security
- [ ] Archive old data (if needed)
- [ ] Update documentation
- [ ] Performance audit

