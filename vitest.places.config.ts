import { defineConfig } from 'vitest/config'

// 인기 도시 장소 스냅숏 받기 전용 (네트워크 사용, npm test에는 포함하지 않음)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/*.task.ts'],
  },
})
