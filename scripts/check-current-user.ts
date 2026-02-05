import { pool } from '../src/config/database'

async function checkUser() {
    const client = await pool.connect()
    
    try {
        console.log('\n=== Checking All Users ===\n')
        
        // Get all users
        const allUsers = await client.query(`
            SELECT 
                u.id, 
                u.email, 
                u.name, 
                u.role, 
                u.institution_id,
                i.name as institution_name
            FROM users u
            LEFT JOIN institutions i ON u.institution_id = i.id
            ORDER BY u.role, u.email
        `)
        
        console.log(`Found ${allUsers.rows.length} users:\n`)
        
        allUsers.rows.forEach(user => {
            const institutionInfo = user.institution_id 
                ? `✅ ${user.institution_name || 'Unknown Institution'}`
                : '❌ NO INSTITUTION'
            
            console.log(`${user.role.padEnd(20)} | ${user.email.padEnd(35)} | ${institutionInfo}`)
        })
        
        // Check for users without institution
        const usersWithoutInstitution = allUsers.rows.filter(u => !u.institution_id && u.role !== 'MAIN_ADMIN')
        
        if (usersWithoutInstitution.length > 0) {
            console.log('\n⚠️  Users without institution_id:')
            usersWithoutInstitution.forEach(user => {
                console.log(`  - ${user.email} (${user.name})`)
            })
        } else {
            console.log('\n✅ All users have institution_id (except MAIN_ADMIN)')
        }
        
        console.log('\n=== Test Login Credentials ===\n')
        console.log('Email: john.doe@mitcoe.edu')
        console.log('Password: password123')
        console.log('\nOr try any of the emails listed above with password: password123')
        
    } catch (error) {
        console.error('Error:', error)
    } finally {
        client.release()
        await pool.end()
    }
}

checkUser()
