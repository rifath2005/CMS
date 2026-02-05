import { pool } from '../src/config/database'

async function fixUserInstitution() {
    const client = await pool.connect()
    
    try {
        console.log('Checking users without institution_id...')
        
        // Find users without institution_id
        const usersWithoutInstitution = await client.query(`
            SELECT id, email, name, role 
            FROM users 
            WHERE institution_id IS NULL AND role != 'MAIN_ADMIN'
        `)
        
        if (usersWithoutInstitution.rows.length === 0) {
            console.log('✅ All users have institution_id assigned')
            return
        }
        
        console.log(`Found ${usersWithoutInstitution.rows.length} users without institution_id:`)
        usersWithoutInstitution.rows.forEach(user => {
            console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}`)
        })
        
        // Get the first institution (MIT College)
        const institutionResult = await client.query(`
            SELECT id, name FROM institutions LIMIT 1
        `)
        
        if (institutionResult.rows.length === 0) {
            console.log('❌ No institutions found. Please run seed-database first.')
            return
        }
        
        const institution = institutionResult.rows[0]
        console.log(`\nAssigning users to: ${institution.name}`)
        
        // Update users
        const updateResult = await client.query(`
            UPDATE users 
            SET institution_id = $1 
            WHERE institution_id IS NULL AND role != 'MAIN_ADMIN'
            RETURNING id, email, name
        `, [institution.id])
        
        console.log(`\n✅ Updated ${updateResult.rows.length} users:`)
        updateResult.rows.forEach(user => {
            console.log(`  - ${user.email} (${user.name})`)
        })
        
    } catch (error) {
        console.error('Error fixing user institutions:', error)
    } finally {
        client.release()
        await pool.end()
    }
}

fixUserInstitution()
