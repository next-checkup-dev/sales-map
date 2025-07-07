#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
주소 정규화 스크립트
변환 실패한 주소를 자동으로 수정하여 다시 변환을 시도합니다.
"""

import re
import time
from typing import Optional, Tuple
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import requests

class AddressNormalizer:
    def __init__(self):
        """주소 정규화 규칙 초기화"""
        self.normalization_rules = [
            # 괄호와 그 안의 내용 제거
            (r'\([^)]*\)', ''),
            # 쉼표 이후 내용 제거 (층수, 건물명 등)
            (r',\s*[^,]*$', ''),
            # 여러 개의 쉼표가 있는 경우 첫 번째 쉼표까지만 유지
            (r',\s*[^,]*,\s*[^,]*$', lambda m: m.group(0).split(',')[0] + ',' + m.group(0).split(',')[1]),
            # 층수 정보 제거 (숫자층, ~층 등)
            (r',?\s*\d+~?\d*층', ''),
            (r',?\s*[0-9]+층', ''),
            # 건물명 제거 (특정 패턴)
            (r',?\s*[가-힣]+빌딩', ''),
            (r',?\s*[가-힣]+건물', ''),
            # 상세 주소 제거 (동, 호수 등)
            (r',?\s*[0-9]+동', ''),
            (r',?\s*[0-9]+호', ''),
            # 불필요한 공백 정리
            (r'\s+', ' '),
            # 앞뒤 공백 제거
            (r'^\s+|\s+$', ''),
        ]
    
    def normalize_address(self, address: str) -> str:
        """
        주소를 정규화합니다.
        
        Args:
            address (str): 원본 주소
            
        Returns:
            str: 정규화된 주소
        """
        if not address:
            return address
            
        normalized = address.strip()
        
        # 정규화 규칙 적용
        for pattern, replacement in self.normalization_rules:
            if callable(replacement):
                normalized = re.sub(pattern, lambda m: str(replacement(m)), normalized)
            else:
                normalized = re.sub(pattern, replacement, normalized)
        
        # 최종 정리
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
    
    def should_normalize(self, address: str) -> bool:
        """
        주소가 정규화가 필요한지 확인합니다.
        
        Args:
            address (str): 확인할 주소
            
        Returns:
            bool: 정규화 필요 여부
        """
        if not address:
            return False
            
        # 정규화가 필요한 패턴들
        patterns = [
            r'\([^)]*\)',  # 괄호
            r',\s*[^,]*$',  # 쉼표 이후 내용
            r'\d+~?\d*층',  # 층수
            r'[가-힣]+빌딩',  # 빌딩명
            r'[가-힣]+건물',  # 건물명
        ]
        
        for pattern in patterns:
            if re.search(pattern, address):
                return True
        
        return False

class KakaoGeocoder:
    def __init__(self, api_key: str):
        """
        카카오 지도 API 초기화
        
        Args:
            api_key (str): 카카오 REST API 키
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
            credentials_file (str): 구글 서비스 계정 키 파일 경로
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
            spreadsheet_id (str): 스프레드시트 ID
            range_name (str): 범위 (예: 'Sheet1!A:D')
            
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

def main():
    # 설정값 - 실제 값으로 수정하세요!
    KAKAO_API_KEY = "YOUR_KAKAO_REST_API_KEY"  # 카카오 REST API 키를 입력하세요
    GOOGLE_CREDENTIALS_FILE = "google-service-account-key.json"
    SPREADSHEET_ID = "YOUR_SPREADSHEET_ID"  # 구글 시트 ID를 입력하세요 (URL에서 확인)
    SHEET_NAME = "Sheet1"  # 시트 이름을 입력하세요
    
    # 설정값 검증
    if KAKAO_API_KEY == "YOUR_KAKAO_REST_API_KEY":
        print("오류: 카카오 REST API 키를 설정해주세요!")
        print("address_normalizer.py 파일의 KAKAO_API_KEY 변수를 수정하세요.")
        return
        
    if SPREADSHEET_ID == "YOUR_SPREADSHEET_ID":
        print("오류: 구글 시트 ID를 설정해주세요!")
        print("구글 시트 URL에서 스프레드시트 ID를 복사하여 SPREADSHEET_ID 변수를 수정하세요.")
        return
    
    print("주소 정규화 및 재변환 스크립트 시작")
    
    # 초기화
    normalizer = AddressNormalizer()
    geocoder = KakaoGeocoder(KAKAO_API_KEY)
    sheets_updater = GoogleSheetsUpdater(GOOGLE_CREDENTIALS_FILE)
    sheets_updater.authenticate()
    
    # 기존 데이터 가져오기 (A~F열)
    data_range = f"{SHEET_NAME}!A:F"
    existing_data = sheets_updater.get_sheet_data(SPREADSHEET_ID, data_range)
    
    if not existing_data:
        print("데이터가 없습니다.")
        return
    
    print(f"총 {len(existing_data)}행의 데이터를 확인합니다.")
    
    # 변환 실패한 행들을 찾아서 정규화 후 재시도
    retry_data = []
    
    for i, row in enumerate(existing_data, 1):
        if i < 2:  # 헤더 행 건너뛰기
            continue
            
        if len(row) < 6:
            continue
            
        # E열이 '변환실패'인지 확인
        if len(row) >= 5 and row[4] == "변환실패":
            original_address = row[3] if len(row) > 3 else ""  # D열의 원본 주소
            
            if original_address and normalizer.should_normalize(original_address):
                normalized_address = normalizer.normalize_address(original_address)
                
                print(f"행 {i}: 주소 정규화 시도")
                print(f"  원본: {original_address}")
                print(f"  정규화: {normalized_address}")
                
                # 정규화된 주소로 다시 변환 시도
                coordinates = geocoder.geocode_address(normalized_address)
                
                if coordinates:
                    latitude, longitude = coordinates
                    retry_data.append({
                        'row': i,
                        'range': f"{SHEET_NAME}!E{i}:F{i}",
                        'data': [[latitude, longitude]]
                    })
                    print(f"  → 성공: 위도 {latitude}, 경도 {longitude}")
                else:
                    print(f"  → 여전히 실패")
                
                # API 호출 제한을 위한 대기
                time.sleep(0.1)
    
    # 성공한 데이터들을 구글 시트에 업데이트
    if retry_data:
        print(f"\n총 {len(retry_data)}개의 주소가 정규화 후 변환 성공했습니다.")
        print("구글 시트에 업데이트 중...")
        
        for item in retry_data:
            try:
                sheets_updater.update_sheet_data(
                    SPREADSHEET_ID, 
                    item['range'], 
                    item['data']
                )
                print(f"행 {item['row']} 업데이트 완료")
            except Exception as e:
                print(f"행 {item['row']} 업데이트 실패: {str(e)}")
    else:
        print("정규화 후 변환 성공한 주소가 없습니다.")
    
    print("모든 작업이 완료되었습니다!")

if __name__ == "__main__":
    main() 