<template>
  <div class="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
    <!-- Background wave effects -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div class="absolute -bottom-40 -right-40 w-80 h-80 bg-white/5 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div class="absolute -top-40 -left-20 w-80 h-80 bg-white/5 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
    </div>

    <!-- Sign In Card with Animation -->
    <Transition
      appear
      enter-active-class="transition-all duration-1000 ease-out"
      enter-from-class="opacity-0 transform translate-y-8 blur-lg"
      enter-to-class="opacity-100 transform translate-y-0 blur-none"
    >
      <div class="relative z-10 bg-black rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-gray-800 animate-fade-in-slide-up">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">ยินดีต้อนรับกลับ</h1>
          <p class="text-gray-400">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        <!-- Error/Success Messages -->
        <div v-if="message" :class="`mb-4 p-3 rounded-lg text-sm ${messageType === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`">
          {{ message }}
        </div>

        <!-- Sign In Form -->
        <form @submit.prevent="handleSignIn" class="space-y-6">
          <!-- Email/Username Field -->
          <div>
            <input
              id="identifier"
              v-model="form.identifier"
              type="text"
              placeholder="อีเมลหรือชื่อผู้ใช้"
              class="w-full px-4 py-3 bg-black border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
              :required="isClient"
            />
            <p class="text-xs text-gray-400 mt-1">สามารถใช้อีเมลหรือชื่อผู้ใช้เพื่อเข้าสู่ระบบ</p>
          </div>

          <!-- Password Field -->
          <div>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="รหัสผ่าน"
                class="w-full px-4 py-3 bg-black border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 pr-12"
                :required="isClient"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังเข้าสู่ระบบ...
            </span>
            <span v-else>เข้าสู่ระบบ</span>
          </button>
        </form>

        <!-- Separator -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-black text-gray-400">หรือดำเนินการต่อด้วย</span>
          </div>
        </div>

        <!-- Social Login Buttons -->
        <div class="space-y-4">
          <!-- Google Button -->
          <button
            @click="handleGoogleSignIn"
            :disabled="loading"
            class="w-full flex items-center justify-center px-4 py-3 bg-black border border-gray-600 rounded-xl text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span v-if="loading">กำลังดำเนินการ...</span>
            <span v-else>ดำเนินการต่อด้วย Google</span>
          </button>

          <!-- Apple Button -->
          <button
            @click="handleAppleSignIn"
            :disabled="loading"
            class="w-full flex items-center justify-center px-4 py-3 bg-black border border-gray-600 rounded-xl text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span v-if="loading">กำลังดำเนินการ...</span>
            <span v-else>ดำเนินการต่อด้วย Apple</span>
          </button>
        </div>

        <!-- Sign Up Link -->
        <div class="text-center mt-8">
          <p class="text-gray-400">
            ยังไม่มีบัญชี? 
            <NuxtLink to="/signup" class="text-white hover:text-gray-300 font-medium transition-colors underline">
              สมัครสมาชิก
            </NuxtLink>
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
// Use auth layout (no footer)
definePageMeta({
  layout: 'auth'
})

const form = ref({
  identifier: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const message = ref('')
const messageType = ref('')

// Ensure this runs only on client side
const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '616609232183-qth5o01fmleiketoq9o4atjavcuom9bt.apps.googleusercontent.com'

const showMessage = (text, type = 'error') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

const handleSignIn = async () => {
  loading.value = true
  message.value = ''
  
  try {
    const response = await $fetch('http://localhost:8000/api/login', {
      method: 'POST',
      body: {
        identifier: form.value.identifier,
        password: form.value.password
      }
    })
    
    // Store token and user data
    localStorage.setItem('token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    showMessage('เข้าสู่ระบบสำเร็จ!', 'success')
    
    // Redirect to dashboard or home page
    setTimeout(() => {
      navigateTo('/dashboard')
    }, 1000)
    
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage = error.data?.msg || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    showMessage(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

const handleGoogleSignIn = async () => {
  loading.value = true
  message.value = ''
  
  try {
    // Initialize Google Identity Services
    if (typeof google === 'undefined') {
      showMessage('Google OAuth ไม่พร้อมใช้งาน', 'error')
      return
    }
    
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (response) => {
        if (response.error) {
          showMessage('การเข้าสู่ระบบด้วย Google ล้มเหลว', 'error')
          loading.value = false
          return
        }
        
        try {
          // Send access token to backend
          const authResponse = await $fetch('http://localhost:8000/api/google', {
            method: 'POST',
            body: {
              access_token: response.access_token
            }
          })
          
          // Store token and user data
          localStorage.setItem('token', authResponse.access_token)
          localStorage.setItem('user', JSON.stringify(authResponse.user))
          
          showMessage('เข้าสู่ระบบด้วย Google สำเร็จ!', 'success')
          
          // Redirect to dashboard or home page
          setTimeout(() => {
            navigateTo('/dashboard')
          }, 1000)
          
        } catch (error) {
          console.error('Google auth error:', error)
          const errorMessage = error.data?.msg || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google'
          showMessage(errorMessage, 'error')
        } finally {
          loading.value = false
        }
      }
    })
    
    client.requestAccessToken()
    
  } catch (error) {
    console.error('Google sign in error:', error)
    showMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google', 'error')
    loading.value = false
  }
}

const handleAppleSignIn = () => {
  showMessage('การเข้าสู่ระบบด้วย Apple ยังไม่พร้อมใช้งาน', 'error')
}
</script>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

@keyframes fadeInSlideUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
    filter: blur(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0px);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-fade-in-slide-up {
  animation: fadeInSlideUp 1.2s ease-out;
}

/* Smooth transitions for form elements */
form > div {
  animation: fadeInSlideUp 0.8s ease-out;
  animation-fill-mode: both;
  filter: blur(0px);
}

form > div:nth-child(1) { animation-delay: 0.1s; }
form > div:nth-child(2) { animation-delay: 0.2s; }
form > div:nth-child(3) { animation-delay: 0.3s; }
</style>
