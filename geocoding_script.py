#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
구글 시트 주소 데이터를 위도, 경도로 변환하는 스크립트
카카오 지도 API를 사용하여 주소를 좌표로 변환합니다.
"""

import requests
import time
import json
from typing import Optional, Tuple
import pandas as pd
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import os

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
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=range_name
            ).execute()
            
            return result.get('values', [])
        except Exception as e:
            print(f"시트 데이터 가져오기 실패: {str(e)}")
            raise
    
    def update_sheet_data(self, spreadsheet_id: str, range_name: str, values: list):
        """
        구글 시트에 데이터 업데이트
        
        Args:
            spreadsheet_id (str): 스프레드시트 ID
            range_name (str): 범위 (예: 'Sheet1!E:F')
            values (list): 업데이트할 데이터
        """
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
        except Exception as e:
            print(f"시트 업데이트 실패: {str(e)}")
            raise

def main():
    # 설정값
    KAKAO_API_KEY = "YOUR_KAKAO_REST_API_KEY"  # 카카오 REST API 키를 입력하세요
    GOOGLE_CREDENTIALS_FILE = "google-service-account-key.json"
    SPREADSHEET_ID = "YOUR_SPREADSHEET_ID"  # 구글 시트 ID를 입력하세요
    SHEET_NAME = "Sheet1"  # 시트 이름을 입력하세요
    
    # 시작 행 (헤더 제외)
    START_ROW = 2
    
    print("주소-좌표 변환 스크립트 시작")
    
    # 카카오 지오코더 초기화
    geocoder = KakaoGeocoder(KAKAO_API_KEY)
    
    # 구글 시트 업데이터 초기화
    sheets_updater = GoogleSheetsUpdater(GOOGLE_CREDENTIALS_FILE)
    sheets_updater.authenticate()
    
    # 기존 데이터 가져오기 (A~D열)
    data_range = f"{SHEET_NAME}!A:D"
    existing_data = sheets_updater.get_sheet_data(SPREADSHEET_ID, data_range)
    
    if not existing_data:
        print("데이터가 없습니다.")
        return
    
    print(f"총 {len(existing_data)}행의 데이터를 처리합니다.")
    
    # 위도, 경도 데이터 준비
    coordinates_data = []
    
    for i, row in enumerate(existing_data, 1):
        if i < START_ROW:
            # 헤더 행은 건너뛰기
            coordinates_data.append(["", ""])
            continue
            
        if len(row) < 4:
            # D열(주소)이 없는 경우
            coordinates_data.append(["", ""])
            continue
            
        address = row[3]  # D열의 주소
        
        if not address or address.strip() == "":
            coordinates_data.append(["", ""])
            continue
            
        print(f"처리 중: {i}행 - {address}")
        
        # 주소를 좌표로 변환
        coordinates = geocoder.geocode_address(address.strip())
        
        if coordinates:
            latitude, longitude = coordinates
            coordinates_data.append([latitude, longitude])
            print(f"  → 위도: {latitude}, 경도: {longitude}")
        else:
            coordinates_data.append(["", ""])
            print(f"  → 변환 실패")
        
        # API 호출 제한을 위한 대기
        time.sleep(0.1)
    
    # E, F열에 좌표 데이터 업데이트
    coordinates_range = f"{SHEET_NAME}!E:F"
    sheets_updater.update_sheet_data(SPREADSHEET_ID, coordinates_range, coordinates_data)
    
    print("모든 작업이 완료되었습니다!")

if __name__ == "__main__":
    main() 