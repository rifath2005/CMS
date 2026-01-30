import { Pool } from 'pg';
import { InstitutionModel } from './Institution';
import { getPool } from '../config/database';

describe('InstitutionModel', () => {
  let pool: Pool;
  let institutionModel: InstitutionModel;

  beforeAll(async () => {
    pool = getPool();
    institutionModel = new InstitutionModel(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up test institutions before each test
    await pool.query("DELETE FROM institutions WHERE email_domain LIKE 'test%'");
  });

  describe('create', () => {
    it('should create a new institution', async () => {
      const institution = await institutionModel.create(
        'Test University',
        'test1.edu',
        'contact@test1.edu',
        '123-456-7890'
      );

      expect(institution).toBeDefined();
      expect(institution.id).toBeDefined();
      expect(institution.name).toBe('Test University');
      expect(institution.emailDomain).toBe('test1.edu');
      expect(institution.contactEmail).toBe('contact@test1.edu');
      expect(institution.contactPhone).toBe('123-456-7890');
      expect(institution.createdAt).toBeDefined();
    });

    it('should create institution without optional contact info', async () => {
      const institution = await institutionModel.create('Test College', 'test2.edu');

      expect(institution).toBeDefined();
      expect(institution.name).toBe('Test College');
      expect(institution.emailDomain).toBe('test2.edu');
      expect(institution.contactEmail).toBeNull();
      expect(institution.contactPhone).toBeNull();
    });

    it('should throw error for duplicate email domain', async () => {
      await institutionModel.create('Test University', 'test3.edu');

      await expect(
        institutionModel.create('Another University', 'test3.edu')
      ).rejects.toThrow('Email domain already exists');
    });
  });

  describe('findById', () => {
    it('should find institution by ID', async () => {
      const created = await institutionModel.create('Test University', 'test4.edu');
      const found = await institutionModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe(created.name);
      expect(found?.emailDomain).toBe(created.emailDomain);
    });

    it('should return null for non-existent ID', async () => {
      const found = await institutionModel.findById('00000000-0000-0000-0000-000000000999');
      expect(found).toBeNull();
    });
  });

  describe('findByEmailDomain', () => {
    it('should find institution by email domain', async () => {
      const created = await institutionModel.create('Test University', 'test5.edu');
      const found = await institutionModel.findByEmailDomain('test5.edu');

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.emailDomain).toBe('test5.edu');
    });

    it('should return null for non-existent domain', async () => {
      const found = await institutionModel.findByEmailDomain('nonexistent.edu');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all institutions', async () => {
      await institutionModel.create('Test University 1', 'test6.edu');
      await institutionModel.create('Test University 2', 'test7.edu');

      const institutions = await institutionModel.findAll();

      expect(institutions).toBeDefined();
      expect(institutions.length).toBeGreaterThanOrEqual(2);
      
      const testInstitutions = institutions.filter(i => 
        i.emailDomain === 'test6.edu' || i.emailDomain === 'test7.edu'
      );
      expect(testInstitutions.length).toBe(2);
    });
  });

  describe('update', () => {
    it('should update institution name', async () => {
      const created = await institutionModel.create('Test University', 'test8.edu');
      const updated = await institutionModel.update(created.id, { name: 'Updated University' });

      expect(updated.name).toBe('Updated University');
      expect(updated.emailDomain).toBe('test8.edu'); // Should remain unchanged
    });

    it('should update contact information', async () => {
      const created = await institutionModel.create('Test University', 'test9.edu');
      const updated = await institutionModel.update(created.id, {
        contactEmail: 'new@test9.edu',
        contactPhone: '987-654-3210',
      });

      expect(updated.contactEmail).toBe('new@test9.edu');
      expect(updated.contactPhone).toBe('987-654-3210');
    });

    it('should throw error for non-existent institution', async () => {
      await expect(
        institutionModel.update('00000000-0000-0000-0000-000000000999', { name: 'Test' })
      ).rejects.toThrow('Institution not found');
    });

    it('should throw error when no fields to update', async () => {
      const created = await institutionModel.create('Test University', 'test10.edu');
      await expect(institutionModel.update(created.id, {})).rejects.toThrow('No fields to update');
    });
  });

  describe('delete', () => {
    it('should delete institution', async () => {
      const created = await institutionModel.create('Test University', 'test11.edu');
      const result = await institutionModel.delete(created.id);

      expect(result).toBe(true);

      const found = await institutionModel.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent institution', async () => {
      const result = await institutionModel.delete('00000000-0000-0000-0000-000000000999');
      expect(result).toBe(false);
    });
  });

  describe('emailDomainExists', () => {
    it('should return true for existing domain', async () => {
      await institutionModel.create('Test University', 'test12.edu');
      const exists = await institutionModel.emailDomainExists('test12.edu');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent domain', async () => {
      const exists = await institutionModel.emailDomainExists('nonexistent.edu');
      expect(exists).toBe(false);
    });
  });

  describe('validateInstitutionalEmail', () => {
    beforeEach(async () => {
      await institutionModel.create('Test University', 'test13.edu');
    });

    it('should return institution for valid email', async () => {
      const institution = await institutionModel.validateInstitutionalEmail('student@test13.edu');

      expect(institution).toBeDefined();
      expect(institution?.emailDomain).toBe('test13.edu');
    });

    it('should return null for invalid domain', async () => {
      const institution = await institutionModel.validateInstitutionalEmail('student@invalid.edu');
      expect(institution).toBeNull();
    });

    it('should return null for invalid email format', async () => {
      const institution = await institutionModel.validateInstitutionalEmail('invalid-email');
      expect(institution).toBeNull();
    });

    it('should return null for email without domain', async () => {
      const institution = await institutionModel.validateInstitutionalEmail('student@');
      expect(institution).toBeNull();
    });
  });
});
