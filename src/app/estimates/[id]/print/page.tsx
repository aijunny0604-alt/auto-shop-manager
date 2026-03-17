"use client";

import { useEffect, useState, use } from "react";
import { fetchEstimate } from "@/features/estimates/api";
import type { Estimate } from "@/types/estimate";

export default function EstimatePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstimate(id)
      .then(setEstimate)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const formatCurrency = (n: number) => n.toLocaleString("ko-KR");

  if (loading) return <p className="text-center py-10">로딩 중...</p>;
  if (!estimate) return <p className="text-center py-10">견적서를 찾을 수 없습니다.</p>;

  const laborItems = estimate.items?.filter((i) => i.type === "LABOR") || [];
  const partItems = estimate.items?.filter((i) => i.type === "PART") || [];
  const allItems = [...laborItems, ...partItems];

  return (
    <div className="min-h-screen bg-white">
      {/* 인쇄 버튼 (인쇄 시 숨김) */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
        >
          인쇄 / PDF 저장
        </button>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 shadow-lg hover:bg-gray-300"
        >
          뒤로가기
        </button>
      </div>

      {/* 견적서 본문 */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-6 print:max-w-none">
        {/* 헤더 */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-wider">견 적 서</h1>
          <p className="text-sm text-gray-500 mt-1">{estimate.estimateNo}</p>
        </div>

        {/* 업체 + 고객 정보 */}
        <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
          {/* 고객 정보 */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">고 객 정 보</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="text-gray-500 py-1 w-20">고객명</td>
                  <td className="font-medium">{estimate.customer?.name}</td>
                </tr>
                <tr>
                  <td className="text-gray-500 py-1">연락처</td>
                  <td>{estimate.customer?.phone || "-"}</td>
                </tr>
                {estimate.vehicle && (
                  <>
                    <tr>
                      <td className="text-gray-500 py-1">차종</td>
                      <td>{estimate.vehicle.carModel}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-500 py-1">차량번호</td>
                      <td>{estimate.vehicle.plateNumber || "-"}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* 업체 정보 */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">업 체 정 보</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="text-gray-500 py-1 w-20">상호</td>
                  <td className="font-medium">BIGS MOTORS</td>
                </tr>
                <tr>
                  <td className="text-gray-500 py-1">견적일</td>
                  <td>{new Date(estimate.createdAt).toLocaleDateString("ko-KR")}</td>
                </tr>
                {estimate.validUntil && (
                  <tr>
                    <td className="text-gray-500 py-1">유효기간</td>
                    <td>{new Date(estimate.validUntil).toLocaleDateString("ko-KR")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 합계 요약 */}
        <div className="bg-gray-50 border border-gray-300 rounded p-4 mb-6 text-center">
          <span className="text-gray-600 text-sm">총 견적 금액: </span>
          <span className="text-2xl font-bold text-gray-900 ml-2">
            {formatCurrency(estimate.totalAmount)}원
          </span>
          <span className="text-sm text-gray-500 ml-1">(VAT 별도)</span>
        </div>

        {/* 항목 테이블 */}
        <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-center w-10">No</th>
              <th className="border border-gray-300 px-3 py-2 text-center w-16">구분</th>
              <th className="border border-gray-300 px-3 py-2 text-left">항목명</th>
              <th className="border border-gray-300 px-3 py-2 text-center w-16">수량</th>
              <th className="border border-gray-300 px-3 py-2 text-right w-24">단가</th>
              <th className="border border-gray-300 px-3 py-2 text-right w-28">금액</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-gray-300 px-3 py-2 text-center">{idx + 1}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {item.type === "LABOR" ? "공임" : "부품"}
                </td>
                <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            {/* 빈 행 채우기 (최소 8행) */}
            {Array.from({ length: Math.max(0, 8 - allItems.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-300">
                  {allItems.length + i + 1}
                </td>
                <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
                <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
                <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
                <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
                <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 합계 */}
        <div className="flex justify-end mb-6">
          <table className="text-sm w-64">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600">소계</td>
                <td className="py-1 text-right">
                  {formatCurrency(estimate.totalAmount + estimate.discount)}원
                </td>
              </tr>
              {estimate.discount > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">할인</td>
                  <td className="py-1 text-right text-red-600">
                    -{formatCurrency(estimate.discount)}원
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-800">
                <td className="py-2 font-bold text-base">합계</td>
                <td className="py-2 text-right font-bold text-base">
                  {formatCurrency(estimate.totalAmount)}원
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 비고 */}
        <div className="border border-gray-300 rounded p-4 mb-8">
          <h3 className="font-bold text-gray-700 text-sm mb-1">비고</h3>
          <p className="text-sm text-gray-600 min-h-[40px]">{estimate.memo || ""}</p>
        </div>

        {/* 푸터 */}
        <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          <p>본 견적서는 상기 유효기간 내에만 유효합니다.</p>
          <p className="mt-1">BIGS MOTORS</p>
        </div>
      </div>
    </div>
  );
}
