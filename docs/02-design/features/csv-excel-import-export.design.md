# CSV/Excel Import/Export 상세 설계서

## 1. 데이터 모델

### 1.1 빅스모터스 CSV 컬럼 매핑

| CSV 컬럼 | 시스템 모델 | 필드 |
|----------|------------|------|
| 예약일자 | Reservation | scheduledAt |
| 상태 | Reservation | status |
| 소유 차량 | Vehicle | carModel |
| 차량 번호 | Vehicle | plateNumber |
| 시작시간 | Reservation | scheduledAt (시간) |
| 종료시간 | Reservation | duration (계산) |
| 연락처 | Customer | phone |
| 금액 | ServiceRecord | cost |
| 수리 내용 | ServiceRecord | description |
| 비고1~3 | Reservation/ServiceRecord | memo |
| 항목1~5 | InventoryItem | name |
| 사용량1~5 | StockLog / ServicePartUsed | quantity |
| startDate | Reservation | scheduledAt |
| endDate | Reservation | (종료 계산) |

### 1.2 새 테이블: ImportHistory

```prisma
model ImportHistory {
  id          String   @id @default(cuid())
  fileName    String
  fileType    String   // "csv" | "xlsx"
  rowCount    Int
  successCount Int
  errorCount  Int
  status      String   // "SUCCESS" | "PARTIAL" | "FAILED"
  errors      String?  // JSON array of error messages
  createdAt   DateTime @default(now())
}
```

## 2. API 설계

### 2.1 POST /api/inventory/import
- **역할**: CSV/Excel 파일 업로드 및 데이터 임포트
- **Request**: multipart/form-data (file)
- **Response**: { success, imported, errors, importId }

### 2.2 POST /api/inventory/import/preview
- **역할**: 파일 파싱 후 미리보기 데이터 반환
- **Request**: multipart/form-data (file)
- **Response**: { headers, rows, mappings }

### 2.3 GET /api/inventory/export
- **역할**: 현재 재고 데이터를 Excel로 다운로드
- **Response**: application/vnd.openxmlformats (xlsx binary)

## 3. 프론트엔드 컴포넌트

### 3.1 FileUploadModal
- 드래그앤드롭 + 클릭 업로드
- 파일 타입 검증 (.csv, .xlsx, .xls)
- 업로드 진행률 표시

### 3.2 ImportPreviewModal
- 파싱된 데이터 테이블 미리보기
- 컬럼 매핑 확인
- 임포트 확인/취소

### 3.3 ExportButton
- Excel 다운로드 버튼
- 다운로드 진행 표시

## 4. 파싱 로직

### 4.1 빅스모터스 양식 감지
1. 첫 5행 스캔하여 헤더 행 찾기
2. "예약일자", "차량 번호", "금액" 등 키워드로 헤더 식별
3. 헤더 이후 행을 데이터 행으로 처리
4. 빈 행(FALSE만 있는 행) 필터링

### 4.2 데이터 변환 파이프라인
1. 파일 읽기 (xlsx 라이브러리)
2. 헤더 행 감지
3. 데이터 행 추출 (빈 행 제외)
4. 컬럼 매핑 적용
5. 유효성 검증 (Zod)
6. DB 저장 (Prisma 트랜잭션)
