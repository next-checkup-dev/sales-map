#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
구글 시트 주소 데이터를 위도, 경도로 변환하는 스크립트
카카오 지도 API를 사용하여 주소를 좌표로 변환합니다.
"""

import requests
import time
import json
import re
from typing import Optional, Tuple
import pandas as pd
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import os

def normalize_address(address: str) -> str:
    """
    주소를 정규화하여 상세 정보를 제거합니다.
    
    Args:
        address (str): 원본 주소
        
    Returns:
        str: 정규화된 주소
    """
    if not address:
        return address
    
    # 쉼표 이후의 상세 정보 제거
    # 예: '강원특별자치도 강릉시 경강로 2079, 2~5층(임당동, 유암빌딩)' -> '강원특별자치도 강릉시 경강로 2079'
    normalized = re.split(r'[,，]', address)[0].strip()
    
    # 괄호 안의 상세 정보 제거
    # 예: '강원특별자치도 강릉시 경강로 2079 (임당동, 유암빌딩)' -> '강원특별자치도 강릉시 경강로 2079'
    normalized = re.sub(r'\s*\([^)]*\)', '', normalized)
    
    # 층수 정보 제거 (숫자층, ~층, 층 등)
    normalized = re.sub(r'\s*\d+~?\d*층', '', normalized)
    normalized = re.sub(r'\s*[0-9]+[Ff]', '', normalized)
    
    # 건물명 제거 (일반적인 패턴)
    building_patterns = [
        r'\s*[A-Za-z0-9가-힣]+빌딩',
        r'\s*[A-Za-z0-9가-힣]+타워',
        r'\s*[A-Za-z0-9가-힣]+센터',
        r'\s*[A-Za-z0-9가-힣]+플라자',
        r'\s*[A-Za-z0-9가-힣]+아파트',
        r'\s*[A-Za-z0-9가-힣]+상가',
        r'\s*[A-Za-z0-9가-힣]+오피스',
    ]
    
    for pattern in building_patterns:
        normalized = re.sub(pattern, '', normalized)
    
    # 연속된 공백 제거
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized

class KakaoGeocoder:
    def __init__(self, api_key: str):
        """
        카카오 지도 API 초기화
        
        Args:
            api_key (str): 498e5bb317e1d1d671940222856329b0
        """
        self.api_key = api_key
        self.base_url = "https://dapi.kakao.com/v2/local/search/address.json"
        self.headers = {
            "Authorization": f"KakaoAK {api_key}"
        }
    
    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        주소를 위도, 경도로 변환
        
        Args:
            address (str): 변환할 주소
            
        Returns:
            Optional[Tuple[float, float]]: (위도, 경도) 또는 None
        """
        try:
            params = {
                "query": address
            }
            
            response = requests.get(
                self.base_url,
                headers=self.headers,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data["documents"]:
                    # 첫 번째 결과 사용
                    result = data["documents"][0]
                    latitude = float(result["y"])
                    longitude = float(result["x"])
                    return (latitude, longitude)
                else:
                    print(f"주소를 찾을 수 없습니다: {address}")
                    return None
            else:
                print(f"API 요청 실패: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"주소 변환 중 오류 발생: {address}, 오류: {str(e)}")
            return None

class GoogleSheetsUpdater:
    def __init__(self, credentials_file: str):
        """
        구글 시트 업데이터 초기화
        
        Args:
            credentials_file (str): google-service-account-key.json
        """
        self.credentials_file = credentials_file
        self.scope = ['https://www.googleapis.com/auth/spreadsheets']
        self.service = None
        
    def authenticate(self):
        """구글 API 인증"""
        try:
            credentials = Credentials.from_service_account_file(
                self.credentials_file, 
                scopes=self.scope
            )
            self.service = build('sheets', 'v4', credentials=credentials)
            print("구글 API 인증 성공")
        except Exception as e:
            print(f"구글 API 인증 실패: {str(e)}")
            raise
    
    def get_sheet_data(self, spreadsheet_id: str, range_name: str) -> list:
        """
        구글 시트에서 데이터 가져오기
        
        Args:
            spreadsheet_id (str): 12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA
            range_name (str): 범위 (예: '시트1!D:F')
            
        Returns:
            list: 시트 데이터
        """
        if self.service is None:
            raise Exception("구글 API 서비스가 초기화되지 않았습니다. authenticate() 메서드를 먼저 호출하세요.")
            
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=range_name
            ).execute()
            
            return result.get('values', [])
        except Exception as e:
            print(f"시트 데이터 가져오기 실패: {str(e)}")
            raise
    
    def update_sheet_data(self, spreadsheet_id: str, range_name: str, values: list, max_retries=3):
        """
        구글 시트에 데이터 업데이트 (재시도 로직 포함)
        
        Args:
            spreadsheet_id (str): 스프레드시트 ID
            range_name (str): 범위 (예: 'Sheet1!E:F')
            values (list): 업데이트할 데이터
            max_retries (int): 최대 재시도 횟수
        """
        if self.service is None:
            raise Exception("구글 API 서비스가 초기화되지 않았습니다. authenticate() 메서드를 먼저 호출하세요.")
        
        for attempt in range(max_retries):
            try:
                body = {
                    'values': values
                }
                
                result = self.service.spreadsheets().values().update(
                    spreadsheetId=spreadsheet_id,
                    range=range_name,
                    valueInputOption='RAW',
                    body=body
                ).execute()
                
                print(f"업데이트 완료: {result.get('updatedCells')}개 셀")
                return
                
            except Exception as e:
                print(f"시트 업데이트 실패 (시도 {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    print("5초 후 재시도합니다...")
                    time.sleep(5)
                else:
                    print("최대 재시도 횟수 초과. 업데이트를 건너뜁니다.")
                    raise
    
    def update_sheet_data_in_chunks(self, spreadsheet_id: str, range_name: str, values: list, chunk_size=50):
        """
        구글 시트에 데이터를 청크 단위로 업데이트
        
        Args:
            spreadsheet_id (str): 스프레드시트 ID
            range_name (str): 범위 (예: 'Sheet1!E:F')
            values (list): 업데이트할 데이터
            chunk_size (int): 한 번에 처리할 행 수
        """
        if not values:
            print("업데이트할 데이터가 없습니다.")
            return
            
        total_rows = len(values)
        print(f"총 {total_rows}행을 {chunk_size}행씩 나누어 업데이트합니다...")
        
        for i in range(0, total_rows, chunk_size):
            chunk = values[i:i + chunk_size]
            chunk_start_row = i + 1  # 1부터 시작하는 행 번호
            
            # 범위 계산 (예: Sheet1!E2:F51)
            if '!' in range_name:
                sheet_name = range_name.split('!')[0]
                columns = range_name.split('!')[1].split(':')[0]  # E:F에서 E만 추출
                chunk_range = f"{sheet_name}!{columns}{chunk_start_row}:{columns}{chunk_start_row + len(chunk) - 1}"
            else:
                chunk_range = f"{range_name}{chunk_start_row}:{range_name}{chunk_start_row + len(chunk) - 1}"
            
            print(f"청크 {i//chunk_size + 1} 업데이트 중... (행 {chunk_start_row}-{chunk_start_row + len(chunk) - 1})")
            
            try:
                self.update_sheet_data(spreadsheet_id, chunk_range, chunk)
                time.sleep(1)  # 청크 간 대기
            except Exception as e:
                print(f"청크 업데이트 실패: {str(e)}")
                continue

def process_failed_coordinates(spreadsheet_id: str, sheet_name: str, geocoder: KakaoGeocoder, sheets_updater: GoogleSheetsUpdater, chunk_size=50):
    """
    E열이 '변환실패'인 행들의 주소를 다시 지오코딩하여 좌표를 추가합니다.
    
    Args:
        spreadsheet_id (str): 스프레드시트 ID
        sheet_name (str): 시트 이름
        geocoder (KakaoGeocoder): 지오코더 인스턴스
        sheets_updater (GoogleSheetsUpdater): 시트 업데이터 인스턴스
        chunk_size (int): 한 번에 처리할 행 수
    """
    print("\n=== E열 '변환실패' 주소 재지오코딩 시작 ===")
    
    # 전체 데이터 가져오기 (A~F열)
    data_range = f"{sheet_name}!A:F"
    all_data = sheets_updater.get_sheet_data(spreadsheet_id, data_range)
    
    if not all_data:
        print("데이터가 없습니다.")
        return
    
    # E열이 '변환실패'인 행들 찾기 (헤더 제외)
    failed_rows = []
    for i, row in enumerate(all_data, 1):
        if i == 1:  # 헤더 행은 건너뛰기
            continue
        if len(row) >= 5 and row[4] == "변환실패":  # E열이 '변환실패'인 경우
            failed_rows.append((i, row))
    
    if not failed_rows:
        print("E열이 '변환실패'인 주소가 없습니다.")
        return
    
    print(f"E열이 '변환실패'인 주소 {len(failed_rows)}개를 찾았습니다.")
    
    # 50행씩 청크로 나누어 처리
    total_failed = len(failed_rows)
    
    for chunk_start in range(0, total_failed, chunk_size):
        chunk_end = min(chunk_start + chunk_size, total_failed)
        chunk_failed_rows = failed_rows[chunk_start:chunk_end]
        
        print(f"\n=== 청크 {chunk_start//chunk_size + 1} 처리 중 (행 {chunk_start + 1}-{chunk_end}) ===")
        
        # 현재 청크의 좌표 데이터 수집
        chunk_coordinates_data = []
        chunk_row_numbers = []
        
        for row_num, row in chunk_failed_rows:
            if len(row) < 4:
                continue
                
            original_address = row[3]  # D열의 원본 주소
            
            if not original_address or original_address.strip() == "":
                continue
            
            print(f"행 {row_num}: '{original_address}'")
            
            # 원본 주소로 바로 지오코딩 시도
            coordinates = geocoder.geocode_address(original_address)
            
            if coordinates:
                latitude, longitude = coordinates
                chunk_coordinates_data.append([latitude, longitude])
                chunk_row_numbers.append(row_num)
                print(f"  → 성공: 위도 {latitude}, 경도 {longitude}")
            else:
                # 여전히 실패 시 '변환실패' 유지
                chunk_coordinates_data.append(["변환실패", ""])
                chunk_row_numbers.append(row_num)
                print(f"  → 여전히 실패")
            
            # API 호출 제한을 위한 대기
            time.sleep(0.1)
        
        # 현재 청크의 좌표들을 개별 행으로 업데이트
        if chunk_coordinates_data:
            print(f"청크 {chunk_start//chunk_size + 1}에서 {len(chunk_coordinates_data)}개 주소를 개별 업데이트합니다...")
            
            for row_num, coordinates in zip(chunk_row_numbers, chunk_coordinates_data):
                # 개별 행으로 업데이트
                row_range = f"{sheet_name}!E{row_num}:F{row_num}"
                sheets_updater.update_sheet_data(spreadsheet_id, row_range, [coordinates])
                time.sleep(0.2)  # 각 행 업데이트 간 대기
            
            print(f"청크 {chunk_start//chunk_size + 1} 업데이트 완료!")
        else:
            print(f"청크 {chunk_start//chunk_size + 1}에서 처리할 주소가 없습니다.")
        
        # 다음 청크 처리 전 대기
        if chunk_end < total_failed:
            print("다음 청크 처리 전 3초 대기...")
            time.sleep(3)
    
    print("E열 '변환실패' 주소 재지오코딩 완료!")

def main():
    # 설정값 - 실제 값으로 수정하세요!
    KAKAO_API_KEY = "498e5bb317e1d1d671940222856329b0"  # 카카오 REST API 키를 입력하세요
    GOOGLE_CREDENTIALS_FILE = "google-service-account-key.json"
    SPREADSHEET_ID = "12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA"  # 구글 시트 ID를 입력하세요 (URL에서 확인)
    SHEET_NAME = "시트1"  # 시트 이름을 입력하세요
    
    # 설정값 검증
    if KAKAO_API_KEY == "YOUR_KAKAO_REST_API_KEY":
        print("오류: 카카오 REST API 키를 설정해주세요!")
        print("geocoding_script.py 파일의 KAKAO_API_KEY 변수를 수정하세요.")
        return
        
    if SPREADSHEET_ID == "YOUR_SPREADSHEET_ID":
        print("오류: 구글 시트 ID를 설정해주세요!")
        print("구글 시트 URL에서 스프레드시트 ID를 복사하여 SPREADSHEET_ID 변수를 수정하세요.")
        print("예: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit")
        print("     ↑ 이 부분이 스프레드시트 ID입니다")
        return
    
    # 시작 행 (헤더 제외)
    START_ROW = 2
    
    print("주소-좌표 변환 스크립트 시작")
    
    # 카카오 지오코더 초기화
    geocoder = KakaoGeocoder(KAKAO_API_KEY)
    
    # 구글 시트 업데이터 초기화
    sheets_updater = GoogleSheetsUpdater(GOOGLE_CREDENTIALS_FILE)
    sheets_updater.authenticate()
    
    # E열이 '변환실패'인 주소들 재지오코딩
    process_failed_coordinates(SPREADSHEET_ID, SHEET_NAME, geocoder, sheets_updater)
    
    print("모든 작업이 완료되었습니다!")

if __name__ == "__main__":
    main() 