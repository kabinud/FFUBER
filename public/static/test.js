// Simple test function
function testShowDashboard() {
  console.log('Test function called')
  const landingPage = document.getElementById('landing-page')
  const appContent = document.getElementById('app-content')
  
  console.log('Landing page found:', !!landingPage)
  console.log('App content found:', !!appContent)
  
  if (landingPage && appContent) {
    landingPage.classList.add('hidden')
    appContent.classList.remove('hidden')
    
    // Add simple content to dashboard
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.innerHTML = '<div class="bg-white p-6 rounded shadow"><h2 class="text-2xl font-bold">Dashboard Test</h2><p>This is a test dashboard that should appear after login.</p><p>If you can see this, the DOM manipulation is working correctly.</p></div>'
    }
    
    const sidebar = document.getElementById('sidebar-content')
    if (sidebar) {
      sidebar.innerHTML = '<div class="bg-white p-4 rounded shadow"><h3 class="font-bold">Sidebar Test</h3><p>Sidebar is working too!</p></div>'
    }
    
    console.log('Dashboard test completed')
    alert('Dashboard should now be visible!')
  } else {
    console.error('Elements not found')
    alert('Elements not found!')
  }
}

console.log('Test.js loaded successfully')